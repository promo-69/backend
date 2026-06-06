import { BaseService } from '@bases/service.base.js';
import { Database } from '@database/index.js';
import { ConflictError, NotFoundError, ValidationError } from '@errors';
import { type ProcessedQueryFilters } from '@rules/api-query.type.js';
import { type Transaction, Op } from 'sequelize';

export class RoomsService extends BaseService {
    constructor() {
        super();
    }

    private get _cinemas() {
        return Database.repository('main', 'cinemas') as any;
    }
    private get _rooms() {
        return Database.repository('main', 'rooms') as any;
    }
    private get _seats() {
        return Database.repository('main', 'seats') as any;
    }
    private get _roomProjectionTypes() {
        return Database.repository('main', 'room-projection-types') as any;
    }
    private get _showtimes() {
        return Database.repository('main', 'showtimes') as any;
    }
    private get _roomBookings() {
        return Database.repository('main', 'room-bookings') as any;
    }

    /** Capacidad total real = número de asientos activos */
    private async _getRoomTotalCapacity(roomId: number, transaction?: Transaction): Promise<number> {
        return this._seats.count({ room: roomId }, { transaction });
    }

    private async _attachTotalCapacity(room: any) {
        const capacity = await this._getRoomTotalCapacity(room.id);
        return { ...room, total_capacity: capacity };
    }

    // --- HU-OPERATIVA-07: Registrar sala (sin totalCapacity explícito) ---
    async createRoom(cinemaId: number, body: any, _actorUserId?: number) {
        const { name, projectionTypes, gridRows, gridColumns } = body;

        this.validateRequired({ name, projectionTypes, gridRows, gridColumns }, [
            'name',
            'projectionTypes',
            'gridRows',
            'gridColumns',
        ]);

        if (!Array.isArray(projectionTypes) || projectionTypes.length === 0)
            throw new ValidationError('Debe especificar al menos un tipo de proyección', ['projectionTypes']);

        if (!Number.isInteger(gridRows) || gridRows < 1)
            throw new ValidationError('El número de filas debe ser un entero mayor a 0', ['gridRows']);

        if (!Number.isInteger(gridColumns) || gridColumns < 1)
            throw new ValidationError('El número de columnas debe ser un entero mayor a 0', ['gridColumns']);

        const cinema = await this._cinemas.getFull(cinemaId);
        if (!cinema) throw new NotFoundError('Sucursal no encontrada');

        const existing = await this._rooms.getByNameAndCinema(name, cinemaId);
        if (existing)
            throw new ConflictError('Ya existe una sala con ese nombre en la sucursal', 'ROOM_NAME_DUPLICATE');

        const createdRoom = await this._rooms.transaction(async (transaction: Transaction) => {
            const room = await this._rooms.create(
                {
                    cinema: cinemaId,
                    name,
                    grid_rows: gridRows,
                    grid_columns: gridColumns,
                },
                { transaction },
            );

            const projectionRecords = projectionTypes.map((ptId: number) => ({
                room: room.id,
                projection_type: ptId,
            }));
            await this._roomProjectionTypes.bulkCreate(projectionRecords, { transaction });

            return room;
        });

        return { room_id: createdRoom.id, name: createdRoom.name };
    }

    // --- HU-OPERATIVA-08: Modificar sala (PATCH) ---
    async updateRoom(id: number, body: any) {
        const { name, projectionTypes } = body;

        if (name === undefined && projectionTypes === undefined) {
            throw new ValidationError('No se proporcionaron datos para actualizar', []);
        }

        await this._rooms.transaction(async (transaction: Transaction) => {
            const room = await this._rooms.getById(id, { transaction, lock: transaction.LOCK.UPDATE });
            if (!room) throw new NotFoundError('Sala no encontrada');

            const updateData: Record<string, any> = {};

            if (name !== undefined) {
                if (typeof name !== 'string' || name.trim().length === 0)
                    throw new ValidationError('El nombre no puede estar vacío', ['name']);
                const existing = await this._rooms.getByNameAndCinema(name.trim(), room.cinema);
                if (existing && existing.id !== id)
                    throw new ConflictError('Ya existe una sala con ese nombre en la sucursal', 'ROOM_NAME_DUPLICATE');
                updateData.name = name.trim();
            }

            if (Object.keys(updateData).length > 0) {
                await this._rooms.update(id, updateData, { transaction });
            }

            if (projectionTypes !== undefined) {
                // Validar funciones futuras antes de eliminar tipos de proyección
                const currentTypes = await this._roomProjectionTypes.getAll(
                    { count: false },
                    { room: id },
                    { transaction },
                );
                const currentTypeIds = (Array.isArray(currentTypes) ? currentTypes : currentTypes.rows).map(
                    (r: any) => r.projection_type,
                );

                const typesToRemove = currentTypeIds.filter((ptId: number) => !projectionTypes.includes(ptId));
                if (typesToRemove.length > 0) {
                    const futureCount = await this._showtimes.count(
                        {
                            room: id,
                            start_time: { [Op.gt]: new Date() },
                            projection_type: typesToRemove,
                            deleted_at: null,
                        },
                        { transaction },
                    );
                    if (futureCount > 0)
                        throw new ValidationError(
                            'No se pueden quitar tipos de proyección con funciones futuras programadas',
                            ['projectionTypes'],
                        );
                }

                await this._roomProjectionTypes.deleteByRoom(id, { transaction });
                if (projectionTypes.length > 0) {
                    const records = projectionTypes.map((ptId: number) => ({
                        room: id,
                        projection_type: ptId,
                    }));
                    await this._roomProjectionTypes.bulkCreate(records, { transaction });
                }
            }
        });

        return null;
    }

    // --- HU-OPERATIVA-08 (Adición): Eliminar sala ---
    async deleteRoom(id: number) {
        await this._rooms.transaction(async (transaction: Transaction) => {
            const room = await this._rooms.getById(id, { transaction, lock: transaction.LOCK.UPDATE });
            if (!room) throw new NotFoundError('Sala no encontrada');

            // Obtener IDs de room_bookings asociadas a esta sala
            const bookings = await this._roomBookings.getAll(
                { count: false, attributes: ['id'] },
                { room: id, deleted_at: null },
                { transaction },
            );
            const bookingIds = (Array.isArray(bookings) ? bookings : bookings.rows || []).map((b: any) => b.id);

            let activeShowtimes = 0;
            if (bookingIds.length > 0) {
                activeShowtimes = await this._showtimes.count(
                    { booking: bookingIds, deleted_at: null },
                    { transaction },
                );
            }

            if (activeShowtimes > 0) {
                throw new ConflictError(
                    'No se puede clausurar la sala porque tiene funciones activas',
                    'ROOM_HAS_ACTIVE_SHOWTIMES',
                );
            }
            await this._rooms.delete(id, { transaction });
        });
        return null;
    }

    // --- Consultas ---
    async findAll(cinemaId?: number, filters?: ProcessedQueryFilters) {
        let rooms: any;
        if (cinemaId === undefined) {
            rooms = await this._rooms.getAll(filters || {});
        } else {
            const cinema = await this._cinemas.getFull(cinemaId);
            if (!cinema) throw new NotFoundError('Sucursal no encontrada');
            rooms = await this._rooms.getAllByCinema(cinemaId, filters);
        }

        const attach = async (r: any) => this._attachTotalCapacity(r);
        if (Array.isArray(rooms)) {
            return Promise.all(rooms.map(attach));
        }
        return {
            ...rooms,
            rows: await Promise.all((rooms.rows || []).map(attach)),
        };
    }

    async findById(id: number) {
        const room = await this._rooms.getFull(id);
        if (!room) throw new NotFoundError('Sala no encontrada');
        return this._attachTotalCapacity(room);
    }

    async getSeatMap(roomId: number, filters?: ProcessedQueryFilters) {
        const room = await this._rooms.getFull(roomId);
        if (!room) throw new NotFoundError('Sala no encontrada');
        return this._seats.getAllByRoom(roomId, filters);
    }

    // --- Tipos de proyección ---
    async findRoomProjectionTypes(roomId: number) {
        await this.findById(roomId);
        return this._roomProjectionTypes.getByRoom(roomId);
    }

    async createRoomProjectionType(roomId: number, projectionTypeId: number) {
        await this.findById(roomId);
        if (!Number.isInteger(projectionTypeId) || projectionTypeId <= 0)
            throw new ValidationError('projectionType debe ser un entero positivo', ['projectionType']);
        return this._roomProjectionTypes.create({ room: roomId, projection_type: projectionTypeId });
    }

    async deleteRoomProjectionType(roomId: number, projectionTypeId: number) {
        await this.findById(roomId);
        const record = await this._roomProjectionTypes.getOne({ room: roomId, id: projectionTypeId });
        if (!record) throw new NotFoundError('Tipo de proyección no encontrado en esta sala');
        return this._roomProjectionTypes.delete(record.id);
    }

    // --- Configurar grilla de asientos (regenerar todos) ---
    async configureSeatGrid(roomId: number, body: { gridRows: number; gridColumns: number }) {
        const { gridRows, gridColumns } = body;

        if (!Number.isInteger(gridRows) || gridRows <= 0) {
            throw new ValidationError('gridRows debe ser un entero positivo', ['gridRows']);
        }
        if (!Number.isInteger(gridColumns) || gridColumns <= 0) {
            throw new ValidationError('gridColumns debe ser un entero positivo', ['gridColumns']);
        }

        const room = await this._rooms.getFull(roomId);
        if (!room) throw new NotFoundError('Sala no encontrada');

        // Prevenir si hay funciones activas (opcional)
        const activeShowtimes = await this._showtimes.count({ room: roomId, deleted_at: null });
        if (activeShowtimes > 0) {
            throw new ConflictError(
                'No se puede modificar la distribución de asientos porque la sala tiene funciones activas',
                'ROOM_HAS_ACTIVE_SHOWTIMES',
            );
        }

        await this._rooms.transaction(async (transaction: Transaction) => {
            // Soft delete de todos los asientos actuales
            await this._seats.update({ room: roomId, deleted_at: null }, { deleted_at: new Date() }, { transaction });

            // Generar nuevos asientos
            const seatsToCreate = [];
            for (let row = 0; row < gridRows; row++) {
                const rowLabel = String.fromCharCode(65 + row);
                for (let col = 1; col <= gridColumns; col++) {
                    seatsToCreate.push({
                        room: roomId,
                        row_identifier: rowLabel,
                        column_number: col,
                        seat_category: 1,
                        seat_condition: 1,
                    });
                }
            }
            if (seatsToCreate.length > 0) {
                await this._seats.bulkCreate(seatsToCreate, { transaction });
            }

            // Actualizar dimensiones de la sala
            await this._rooms.update(roomId, { grid_rows: gridRows, grid_columns: gridColumns }, { transaction });
        });

        return null;
    }
}

export default new RoomsService();
