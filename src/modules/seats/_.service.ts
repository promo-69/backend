import { BaseService } from '@bases/service.base.js';
import { Database } from '@database/index.js';
import { ConflictError, NotFoundError, ValidationError } from '@errors';
import { Transaction, Op } from 'sequelize';

export class SeatsService extends BaseService {
    constructor() {
        super();
    }

    private get _seats() {
        return Database.repository('main', 'seats') as any;
    }
    private get _rooms() {
        return Database.repository('main', 'rooms') as any;
    }
    private get _tickets() {
        return Database.repository('main', 'tickets') as any;
    }
    private get _showtimes() {
        return Database.repository('main', 'showtimes') as any;
    }
    private get _roomBookings() {
        return Database.repository('main', 'room-bookings') as any;
    }

    private async _getActiveSeat(seatId: number, transaction?: Transaction, lock?: boolean) {
        const seat = await this._seats.getById(seatId, {
            transaction,
            lock: lock ? transaction?.LOCK?.UPDATE : undefined,
        });
        if (!seat) throw new NotFoundError('Asiento no encontrado');
        return seat;
    }

    private async _getFutureShowtimeIds(transaction?: Transaction): Promise<number[]> {
        const futureShowtimes = await this._showtimes.getAll(
            {
                count: false,
                attributes: ['id'],
                operation: transaction ? { transaction } : undefined,
            },
            {
                start_time: { [Op.gt]: new Date() },
                deleted_at: null,
            },
        );
        const list = Array.isArray(futureShowtimes) ? futureShowtimes : (futureShowtimes?.rows ?? []);
        return list.map((s: any) => s.id);
    }

    private async _seatsWithFutureTickets(seatIds: number[], transaction?: Transaction): Promise<number[]> {
        if (seatIds.length === 0) return [];

        const showtimeIds = await this._getFutureShowtimeIds(transaction);
        if (showtimeIds.length === 0) return [];

        // Obtener los booking IDs asociados a esos showtimes
        const bookingsResult = await this._roomBookings.getAll(
            {
                count: false,
                attributes: ['id'],
                operation: transaction ? { transaction } : undefined,
            },
            { id: showtimeIds }, // room_bookings.id = showtime.booking (1:1)
        );
        const bookingList = Array.isArray(bookingsResult) ? bookingsResult : (bookingsResult?.rows ?? []);
        const bookingIds = bookingList.map((b: any) => b.id);
        if (bookingIds.length === 0) return [];

        // Una sola consulta: tickets donde seat está en seatIds Y booking está en bookingIds futuros
        const ticketsResult = await this._tickets.getAll(
            {
                count: false,
                attributes: ['seat'],
                operation: transaction ? { transaction } : undefined,
            },
            {
                seat: seatIds,
                booking: bookingIds,
                deleted_at: null,
            },
        );
        const ticketList = Array.isArray(ticketsResult) ? ticketsResult : (ticketsResult?.rows ?? []);

        // Devolver IDs de asientos únicos que tienen conflicto
        return [...new Set(ticketList.map((t: any) => t.seat))] as number[];
    }

    /**
     * Versión para un solo asiento — reutiliza _seatsWithFutureTickets.
     */
    private async _hasFutureTickets(seatId: number, transaction?: Transaction): Promise<boolean> {
        const conflicted = await this._seatsWithFutureTickets([seatId], transaction);
        return conflicted.length > 0;
    }

    // --- Crear asiento(s) (objeto único o array) ---
    async createSeats(roomId: number, body: any) {
        const seats = Array.isArray(body) ? body : [body];

        if (seats.length === 0) throw new ValidationError('Debe enviar al menos un asiento', []);

        const room = await this._rooms.getFull(roomId);
        if (!room) throw new NotFoundError('Sala no encontrada');

        const gridRows = room.grid_rows;
        const gridColumns = room.grid_columns;

        const errors: string[] = [];
        const toCreate: any[] = [];

        for (const seatData of seats) {
            const { rowIdentifier, columnNumber, seatCategory, seatCondition } = seatData;

            this.validateRequired({ rowIdentifier, columnNumber, seatCategory, seatCondition }, [
                'rowIdentifier',
                'columnNumber',
                'seatCategory',
                'seatCondition',
            ]);

            const rowIndex = rowIdentifier.charCodeAt(0) - 'A'.charCodeAt(0) + 1;
            if (rowIndex < 1 || rowIndex > gridRows) {
                errors.push(
                    `Fila "${rowIdentifier}" fuera del rango (A-${String.fromCharCode('A'.charCodeAt(0) + gridRows - 1)})`,
                );
                continue;
            }
            if (columnNumber < 1 || columnNumber > gridColumns) {
                errors.push(`Columna ${columnNumber} fuera del rango (1-${gridColumns})`);
                continue;
            }

            const existing = await this._seats.getOne({
                room: roomId,
                row_identifier: rowIdentifier,
                column_number: columnNumber,
            });
            if (existing) {
                errors.push(`Ya existe un asiento en ${rowIdentifier}${columnNumber}`);
                continue;
            }

            toCreate.push({
                room: roomId,
                row_identifier: rowIdentifier,
                column_number: columnNumber,
                seat_category: seatCategory,
                seat_condition: seatCondition,
            });
        }

        if (errors.length > 0) throw new ValidationError(`Errores de validación: ${errors.join('; ')}`, []);

        await this._seats.transaction(async (transaction: Transaction) => {
            for (const data of toCreate) {
                await this._seats.create(data, { transaction });
            }
        });

        return null;
    }

    // --- GET /seats/:id ---
    async findById(seatId: number) {
        const seat = await this._seats.getById(seatId, {
            relations: [
                { association: '_Rooms', attributes: ['id', 'name', 'cinema'] },
                { association: '_SeatCategories', attributes: ['id', 'name'] },
                { association: '_SeatConditions', attributes: ['id', 'name'] },
            ],
        });
        if (!seat) throw new NotFoundError('Asiento no encontrado');
        return seat;
    }

    // --- PATCH /seats/:id ---
    async updateSeat(seatId: number, body: { seatCondition?: number; seatCategory?: number }) {
        const { seatCondition, seatCategory } = body;

        if (seatCondition === undefined && seatCategory === undefined) {
            throw new ValidationError('Debe enviar al menos seatCondition o seatCategory', []);
        }

        await this._seats.transaction(async (transaction: Transaction) => {
            await this._getActiveSeat(seatId, transaction, true); // verifica existencia con lock

            if (seatCondition !== undefined && seatCondition !== 1) {
                const hasFuture = await this._hasFutureTickets(seatId, transaction);
                if (hasFuture) {
                    throw new ConflictError(
                        'No se puede modificar el asiento porque tiene boletos vendidos en funciones futuras.',
                        'SEAT_HAS_FUTURE_TICKETS',
                    );
                }
            }

            const updateData: any = {};
            if (seatCondition !== undefined) updateData.seat_condition = seatCondition;
            if (seatCategory !== undefined) updateData.seat_category = seatCategory;

            await this._seats.update(seatId, updateData, { transaction });
        });

        return null;
    }

    // --- DELETE /seats/:id ---
    async deleteSeat(seatId: number) {
        await this._seats.transaction(async (transaction: Transaction) => {
            await this._getActiveSeat(seatId, transaction, true); // verifica existencia con lock

            const hasFuture = await this._hasFutureTickets(seatId, transaction);
            if (hasFuture) {
                throw new ConflictError(
                    'No se puede eliminar el asiento porque tiene boletos vendidos en funciones futuras.',
                    'SEAT_HAS_FUTURE_TICKETS',
                );
            }

            await this._seats.delete(seatId, { transaction });
        });

        return null;
    }

    // --- DELETE /seats/room/:roomId — eliminar todos los asientos de una sala ---
    async deleteSeatsByRoom(roomId: number) {
        const room = await this._rooms.getById(roomId, { attributes: ['id'] });
        if (!room) throw new NotFoundError('Sala no encontrada');

        await this._seats.transaction(async (transaction: Transaction) => {
            const seatsResult = await this._seats.getAll(
                {
                    count: false,
                    attributes: ['id'],
                    operation: { transaction, lock: transaction.LOCK.UPDATE },
                },
                { room: roomId },
            );
            const seats = Array.isArray(seatsResult) ? seatsResult : (seatsResult?.rows ?? []);

            if (seats.length === 0) return;

            const seatIds = seats.map((s: any) => s.id);

            // Una sola consulta para todos los asientos — O(1) en viajes a BD
            const conflictedIds = await this._seatsWithFutureTickets(seatIds, transaction);

            if (conflictedIds.length > 0) {
                throw new ConflictError(
                    `No se pueden eliminar los asientos porque los siguientes tienen boletos en funciones futuras: ${conflictedIds.join(', ')}`,
                    'SEATS_HAVE_FUTURE_TICKETS',
                );
            }

            for (const id of seatIds) {
                await this._seats.delete(id, { transaction });
            }
        });

        return null;
    }
}

export default new SeatsService();
