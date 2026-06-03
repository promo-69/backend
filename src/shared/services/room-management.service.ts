import { Database } from '@database/index.js';
import { NotFoundError, ValidationError, ConflictError } from '@errors';
import { type ProcessedQueryFilters } from '@rules/api-query.type.js';
import { type Transaction } from 'sequelize';

export class RoomManagementService {
    private get _rooms() {
        return Database.repository('main', 'rooms') as any;
    }
    private get _cinemas() {
        return Database.repository('main', 'cinemas') as any;
    }
    private get _roomProjectionTypes() {
        return Database.repository('main', 'room-projection-types') as any;
    }

    private get _seats() {
        return Database.repository('main', 'seats') as any;
    }

    async findByCinema(cinemaId: number, filters?: ProcessedQueryFilters) {
        const cinema = await this._cinemas.getById(cinemaId, { attributes: ['id'] });
        if (!cinema) throw new NotFoundError('No se encontró la sucursal especificada');

        return this._rooms.getAll(
            {
                count: true,
                relations: [
                    { association: '_Cinema', attributes: ['id', 'name'], required: false },
                    { association: '_RoomProjectionTypes', attributes: ['id', 'projection_type'], required: false },
                ],
                where: { cinema: cinemaId },
                ...filters,
            },
            {},
        );
    }

    async createRoom(cinemaId: number, body: any, _actorUserId?: number) {
        const { name, projectionTypes, gridRows, gridColumns, roomType } = body;

        if (!name?.trim()) throw new ValidationError('El nombre de la sala es obligatorio');
        if (!Array.isArray(projectionTypes) || projectionTypes.length === 0)
            throw new ValidationError('Debe especificar al menos un tipo de proyección');
        if (!Number.isInteger(gridRows) || gridRows < 1)
            throw new ValidationError('El número de filas debe ser un entero positivo');
        if (!Number.isInteger(gridColumns) || gridColumns < 1)
            throw new ValidationError('El número de columnas debe ser un entero positivo');

        const cinema = await this._cinemas.getById(cinemaId, { attributes: ['id'] });
        if (!cinema) throw new NotFoundError('No se encontró la sucursal especificada');

        const existing = await this._rooms.getOne({ cinema: cinemaId, name: name.trim() });
        if (existing)
            throw new ConflictError('Ya existe una sala con este nombre en la sucursal', 'ROOM_NAME_DUPLICATE');

        const createdRoom = await this._rooms.transaction(async (transaction: Transaction) => {
            const room = await this._rooms.create(
                {
                    cinema: cinemaId,
                    name: name.trim(),
                    grid_rows: gridRows,
                    grid_columns: gridColumns,
                    room_type: roomType ?? 1,
                },
                { transaction },
            );

            const projectionRecords = projectionTypes.map((ptId: number) => ({
                room: room.id,
                projection_type: ptId,
            }));
            await this._roomProjectionTypes.bulkCreate(projectionRecords, { transaction });

            // =============================================================
            // Generar asientos automáticamente basados en la grilla
            // =============================================================
            const seatsToCreate = [];
            for (let row = 0; row < gridRows; row++) {
                const rowLabel = String.fromCharCode(65 + row); // A, B, C, ...
                for (let col = 1; col <= gridColumns; col++) {
                    seatsToCreate.push({
                        room: room.id,
                        row_identifier: rowLabel,
                        column_number: col,
                        seat_category: 1, // General (ajusta según tu catálogo)
                        seat_condition: 1, // Operativo
                    });
                }
            }
            if (seatsToCreate.length > 0) {
                for (const seat of seatsToCreate) {
                    await this._seats.create(seat, { transaction });
                }
            }
            return room;
        });

        return { room_id: createdRoom.id, name: createdRoom.name };
    }
}

export default new RoomManagementService();
