import { Database } from '@database/index.js';
import { NotFoundError, ValidationError } from '@errors';
import { Transaction } from 'sequelize';

export class SeatManagementService {
    private get _rooms() {
        return Database.repository('main', 'rooms') as any;
    }
    private get _seats() {
        return Database.repository('main', 'seats') as any;
    }

    async createSeats(
        roomId: number,
        seats: Array<{
            rowIdentifier?: string | number;
            columnNumber?: number;
            seatCategory?: number;
            seatCondition?: number;
            row?: string | number;
            column?: number;
        }>,
    ) {
        const room = await this._rooms.getById(roomId, {
            attributes: ['id', 'grid_rows', 'grid_columns'],
        });
        if (!room) throw new NotFoundError('No se encontró la sala especificada');

        if (!Array.isArray(seats) || seats.length === 0) {
            throw new ValidationError('Debe proporcionar al menos un asiento');
        }

        for (const seat of seats) {
            const row = seat.rowIdentifier ?? seat.row;
            const col = seat.columnNumber ?? seat.column;
            if (row === undefined || row === null || col === undefined || col === null) {
                throw new ValidationError('Cada asiento debe tener fila y columna');
            }
            const rowIndex = typeof row === 'string' ? row.charCodeAt(0) - 'A'.charCodeAt(0) + 1 : Number(row);
            if (rowIndex < 1 || rowIndex > room.grid_rows || Number(col) < 1 || Number(col) > room.grid_columns) {
                throw new ValidationError(`Las coordenadas (${row},${col}) exceden la cuadrícula de la sala`);
            }
        }

        const seatRecords = seats.map((seat: any) => ({
            room: roomId,
            row_identifier: seat.rowIdentifier ?? seat.row,
            column_number: seat.columnNumber ?? seat.column,
            seat_category: seat.seatCategory ?? 1,
            seat_condition: seat.seatCondition ?? 1,
        }));

        return this._seats.transaction(async (transaction: Transaction) => {
            return this._seats.bulkCreate(seatRecords, { transaction });
        });
    }
}

export default new SeatManagementService();
