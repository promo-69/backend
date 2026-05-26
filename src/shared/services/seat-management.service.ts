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

        // Validación de coordenadas (fuera de transacción, no toca BD)
        const seatRecords: any[] = [];
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
            seatRecords.push({
                room: roomId,
                row_identifier: row,
                column_number: col,
                seat_category: seat.seatCategory ?? 1,
                seat_condition: seat.seatCondition ?? 1,
            });
        }

        // Transacción con bloqueo para prevenir condiciones de carrera
        return this._seats.transaction(async (transaction: Transaction) => {
            const createdSeats: any[] = [];
            for (const record of seatRecords) {
                // Intentar crear el asiento; si ya existe, falla con ValidationError
                const existing = await this._seats.getOne(
                    {
                        room: record.room,
                        row_identifier: record.row_identifier,
                        column_number: record.column_number,
                        deleted_at: null,
                    },
                    { transaction, lock: transaction.LOCK.UPDATE },
                );
                if (existing) {
                    throw new ConflictError(
                        `Ya existe un asiento en la posición ${record.row_identifier}${record.column_number}`,
                        'SEAT_POSITION_DUPLICATE',
                    );
                }
                const seat = await this._seats.create(record, { transaction });
                createdSeats.push(seat);
            }
            return createdSeats;
        });
    }
}

export default new SeatManagementService();
