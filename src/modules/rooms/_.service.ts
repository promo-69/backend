import { BaseService } from '@bases/service.base.js';
import { Database } from '@database/index.js';
import { ConflictError, NotFoundError, ValidationError } from '@errors';
import { type ProcessedQueryFilters } from '@rules/api-query.type.js';
import { type Transaction } from 'sequelize';

interface CreateRoomBody {
    cinemaId: number;
    name: string;
    projectionTypes: number[]; // IDs de projection_types (1=2D, 2=3D, 3=IMAX…)
    gridRows: number;
    gridColumns: number;
}

interface UpdateRoomBody {
    name?: string;
    projectionTypes?: number[];
    gridRows?: number;
    gridColumns?: number;
}

// IDs de seat_conditions según seeder de business-catalogs
const SEAT_CONDITION = { OPERATIVE: 1, DAMAGED: 2, MAINTENANCE: 3 } as const;
const SEAT_CATEGORY_DEFAULT = 1; // General

/**
 * Convierte índice 0-based a etiqueta de fila estilo Excel:
 * 0→A, 1→B, …, 25→Z, 26→AA, 27→AB, …
 */
function rowIndexToLabel(index: number): string {
    let label = '';
    let n = index;
    do {
        label = String.fromCharCode(65 + (n % 26)) + label;
        n = Math.floor(n / 26) - 1;
    } while (n >= 0);
    return label;
}

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
    private get _auditLogs() {
        return Database.repository('main', 'catalog-audit-logs') as any;
    }

    private async _writeAudit(
        tableName: string,
        recordId: number,
        action: 'CREATE' | 'UPDATE' | 'DELETE',
        previousData: object | null,
        newData: object | null,
        changedBy?: number,
        transaction?: Transaction,
    ) {
        try {
            await this._auditLogs.create(
                {
                    table_name: tableName,
                    record_id: recordId,
                    action,
                    previous_data: previousData,
                    new_data: newData,
                    changed_by: changedBy ?? null,
                },
                { transaction },
            );
        } catch {
            /* auditoría nunca bloquea */
        }
    }

    private _validateGridDimensions(rows: number, columns: number): void {
        if (!Number.isInteger(rows) || rows < 1 || rows > 50)
            throw new ValidationError('El número de filas debe ser un entero entre 1 y 50', ['gridRows']);
        if (!Number.isInteger(columns) || columns < 1 || columns > 50)
            throw new ValidationError('El número de columnas debe ser un entero entre 1 y 50', ['gridColumns']);
    }

    /** Genera los registros de asientos para bulk insert (RF-2, RF-3) */
    private _buildSeatRecords(roomId: number, rows: number, columns: number): object[] {
        const seats: object[] = [];
        for (let r = 0; r < rows; r++) {
            const rowLabel = rowIndexToLabel(r);
            for (let c = 1; c <= columns; c++) {
                seats.push({
                    room: roomId,
                    row_identifier: rowLabel,
                    column_number: c,
                    seat_category: SEAT_CATEGORY_DEFAULT,
                    seat_condition: SEAT_CONDITION.OPERATIVE,
                    status: 1,
                });
            }
        }
        return seats;
    }

    // --- HU-OPERATIVA-07: Registrar sala ---
    async createRoom(body: CreateRoomBody, actorUserId?: number) {
        const { cinemaId, name, projectionTypes, gridRows, gridColumns } = body;

        this.validateRequired({ cinemaId, name, projectionTypes, gridRows, gridColumns } as any, [
            'cinemaId',
            'name',
            'projectionTypes',
            'gridRows',
            'gridColumns',
        ]);
        if (!Array.isArray(projectionTypes) || projectionTypes.length === 0)
            throw new ValidationError('Debe especificar al menos un tipo de proyección', ['projectionTypes']);

        this._validateGridDimensions(gridRows, gridColumns);

        const cinema = await this._cinemas.getFull(cinemaId);
        if (!cinema || cinema.status !== 1) throw new NotFoundError('Sucursal no encontrada');

        const existing = await this._rooms.getByNameAndCinema(name, cinemaId);
        if (existing && existing.status === 1)
            throw new ConflictError('Ya existe una sala con ese nombre en la sucursal', 'ROOM_NAME_DUPLICATE');

        const totalCapacity = gridRows * gridColumns;

        const createdRoom = await this._rooms.transaction(async (transaction: Transaction) => {
            const room = await this._rooms.create(
                {
                    cinema: cinemaId,
                    name,
                    grid_rows: gridRows,
                    grid_columns: gridColumns,
                    total_capacity: totalCapacity,
                    status: 1,
                },
                { transaction },
            );

            const projectionRecords = projectionTypes.map((ptId: number) => ({
                room: room.id,
                projection_type: ptId,
                status: 1,
            }));
            await this._roomProjectionTypes.bulkCreate(projectionRecords, { transaction });

            const seatRecords = this._buildSeatRecords(room.id, gridRows, gridColumns);
            await this._seats.bulkCreate(seatRecords, { transaction });

            return room;
        });

        await this._writeAudit('rooms', createdRoom.id, 'CREATE', null, createdRoom, actorUserId);
        return this._rooms.getFull(createdRoom.id);
    }

    // --- HU-OPERATIVA-08: Modificar sala ---
    async updateRoom(id: number, body: UpdateRoomBody, actorUserId?: number) {
        const room = await this._rooms.getFull(id);
        if (!room || room.status !== 1) throw new NotFoundError('Sala no encontrada');

        const { name, projectionTypes, gridRows, gridColumns } = body;
        const updateData: Record<string, any> = {};
        const newRows = gridRows ?? room.grid_rows;
        const newCols = gridColumns ?? room.grid_columns;
        const gridChanged =
            (gridRows !== undefined && gridRows !== room.grid_rows) ||
            (gridColumns !== undefined && gridColumns !== room.grid_columns);

        if (name !== undefined && name !== room.name) {
            const existing = await this._rooms.getByNameAndCinema(name, room.cinema);
            if (existing && existing.id !== id && existing.status === 1)
                throw new ConflictError('Ya existe una sala con ese nombre en la sucursal', 'ROOM_NAME_DUPLICATE');
            updateData.name = name;
        }

        if (gridRows !== undefined || gridColumns !== undefined) {
            this._validateGridDimensions(newRows, newCols);
            updateData.grid_rows = newRows;
            updateData.grid_columns = newCols;
            updateData.total_capacity = newRows * newCols; // RF-3: recalcular automáticamente
        }

        if (Object.keys(updateData).length === 0 && projectionTypes === undefined && !gridChanged)
            throw new ValidationError('No se proporcionaron datos para actualizar', []);

        await this._writeAudit('rooms', id, 'UPDATE', room, { ...room, ...updateData }, actorUserId);

        await this._rooms.transaction(async (transaction: Transaction) => {
            if (Object.keys(updateData).length > 0) await this._rooms.update(id, updateData, { transaction });

            if (projectionTypes !== undefined) {
                await this._roomProjectionTypes.deleteByRoom(id, { transaction });
                if (projectionTypes.length > 0) {
                    const records = projectionTypes.map((ptId: number) => ({
                        room: id,
                        projection_type: ptId,
                        status: 1,
                    }));
                    await this._roomProjectionTypes.bulkCreate(records, { transaction });
                }
            }

            // RF-3: si cambia la grilla, eliminar asientos y regenerar
            if (gridChanged) {
                await this._seats.deleteByRoom(id, { transaction });
                const seatRecords = this._buildSeatRecords(id, newRows, newCols);
                await this._seats.bulkCreate(seatRecords, { transaction });
            }
        });

        return this._rooms.getFull(id);
    }

    // --- HU-OPERATIVA-08 (delete): Eliminar sala ---
    async deleteRoom(id: number, actorUserId?: number) {
        const room = await this._rooms.getFull(id);
        if (!room || room.status !== 1) throw new NotFoundError('Sala no encontrada');

        let activeShowtimes = 0;
        try {
            activeShowtimes = await Database.repository('main', 'showtimes').count({ room: id, status: 1 } as any);
        } catch {
            /* módulo showtimes aún no implementado */
        }

        if (activeShowtimes > 0)
            throw new ConflictError(
                'No se puede eliminar la sala porque tiene funciones activas programadas.',
                'ROOM_HAS_ACTIVE_SHOWTIMES',
            );

        await this._writeAudit('rooms', id, 'DELETE', room, null, actorUserId);
        await this._rooms.update(id, { status: 4 });

        return { id, deleted: true };
    }

    // --- HU-OPERATIVA-09: Configurar distribución de asientos ---
    async configureSeatGrid(id: number, body: { gridRows: number; gridColumns: number }, actorUserId?: number) {
        const room = await this._rooms.getFull(id);
        if (!room || room.status !== 1) throw new NotFoundError('Sala no encontrada');

        const { gridRows, gridColumns } = body;
        this.validateRequired({ gridRows, gridColumns } as any, ['gridRows', 'gridColumns']);
        this._validateGridDimensions(gridRows, gridColumns);

        const newCapacity = gridRows * gridColumns;
        const previousData = {
            grid_rows: room.grid_rows,
            grid_columns: room.grid_columns,
            total_capacity: room.total_capacity,
        };

        await this._writeAudit(
            'rooms',
            id,
            'UPDATE',
            previousData,
            { grid_rows: gridRows, grid_columns: gridColumns, total_capacity: newCapacity },
            actorUserId,
        );

        await this._rooms.transaction(async (transaction: Transaction) => {
            await this._seats.deleteByRoom(id, { transaction });
            const seatRecords = this._buildSeatRecords(id, gridRows, gridColumns);
            await this._seats.bulkCreate(seatRecords, { transaction });
            await this._rooms.update(
                id,
                { grid_rows: gridRows, grid_columns: gridColumns, total_capacity: newCapacity },
                { transaction },
            );
        });

        return this._rooms.getFull(id);
    }

    // --- HU-OPERATIVA-10: Inhabilitar asientos ---
    async disableSeats(roomId: number, seatIds: number[], actorUserId?: number) {
        if (!Array.isArray(seatIds) || seatIds.length === 0)
            throw new ValidationError('Debe proporcionar al menos un ID de asiento', ['seatIds']);

        const allSeats = await this._seats.getActiveByRoom(roomId);
        const roomSeatIds: number[] = allSeats.map((s: any) => s.id);
        const invalid = seatIds.filter((sid: number) => !roomSeatIds.includes(sid));
        if (invalid.length > 0)
            throw new ValidationError(`Los siguientes asientos no pertenecen a la sala: ${invalid.join(', ')}`, [
                'seatIds',
            ]);

        await this._seats.update(seatIds, { seat_condition: SEAT_CONDITION.MAINTENANCE });
        await this._writeAudit(
            'seats',
            roomId,
            'UPDATE',
            { seatIds, condition: 'OPERATIVE' },
            { seatIds, condition: 'MAINTENANCE' },
            actorUserId,
        );

        return { roomId, disabled: seatIds.length, seatIds };
    }

    // --- HU-OPERATIVA-11: Rehabilitar asientos ---
    async enableSeats(roomId: number, seatIds: number[], actorUserId?: number) {
        if (!Array.isArray(seatIds) || seatIds.length === 0)
            throw new ValidationError('Debe proporcionar al menos un ID de asiento', ['seatIds']);

        const allSeats = await this._seats.getActiveByRoom(roomId);
        const roomSeatIds: number[] = allSeats.map((s: any) => s.id);
        const invalid = seatIds.filter((sid: number) => !roomSeatIds.includes(sid));
        if (invalid.length > 0)
            throw new ValidationError(`Los siguientes asientos no pertenecen a la sala: ${invalid.join(', ')}`, [
                'seatIds',
            ]);

        await this._seats.update(seatIds, { seat_condition: SEAT_CONDITION.OPERATIVE });
        await this._writeAudit(
            'seats',
            roomId,
            'UPDATE',
            { seatIds, condition: 'MAINTENANCE' },
            { seatIds, condition: 'OPERATIVE' },
            actorUserId,
        );

        return { roomId, enabled: seatIds.length, seatIds };
    }

    // --- Consultas ---
    async findAll(cinemaId: number, filters?: ProcessedQueryFilters) {
        const cinema = await this._cinemas.getFull(cinemaId);
        if (!cinema || cinema.status !== 1) throw new NotFoundError('Sucursal no encontrada');
        return this._rooms.getAllByCinema(cinemaId, filters);
    }

    async findById(id: number) {
        const room = await this._rooms.getFull(id);
        if (!room || room.status !== 1) throw new NotFoundError('Sala no encontrada');
        return room;
    }

    async findSeatsByRoom(roomId: number, filters?: ProcessedQueryFilters) {
        const room = await this._rooms.getFull(roomId);
        if (!room || room.status !== 1) throw new NotFoundError('Sala no encontrada');
        return this._seats.getAllByRoom(roomId, filters);
    }
}

export default new RoomsService();
