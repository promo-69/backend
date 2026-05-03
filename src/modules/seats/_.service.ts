import { BaseService } from '@bases/service.base.js';
import { Database } from '@database/index.js';
import { ConflictError, NotFoundError, ValidationError } from '@errors';

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

    private async _getActiveSeat(seatId: number) {
        const seat = await this._seats.getById(seatId);
        if (!seat || seat.status !== 1) throw new NotFoundError('Asiento no encontrado');
        return seat;
    }

    private async _hasFutureTickets(seatId: number): Promise<boolean> {
        try {
            const count = await this._tickets.count({ seat: seatId, status: 1 });
            return count > 0;
        } catch {
            return false;
        }
    }

    // --- HU-OPERATIVA-09 (Manual): Crear asiento individual ---
    async createSeat(
        roomId: number,
        body: { rowIdentifier: string; columnNumber: number; seatCategory: number; seatCondition: number },
    ) {
        const { rowIdentifier, columnNumber, seatCategory, seatCondition } = body;

        this.validateRequired({ rowIdentifier, columnNumber, seatCategory, seatCondition } as any, [
            'rowIdentifier',
            'columnNumber',
            'seatCategory',
            'seatCondition',
        ]);

        const room = await this._rooms.getFull(roomId);
        if (!room || room.status !== 1) throw new NotFoundError('Sala no encontrada');

        const existing = await this._seats.getOne({ room: roomId, row_identifier: rowIdentifier, column_number: columnNumber });
        if (existing)
            throw new ConflictError('Ya existe un asiento en esa posición de la sala', 'SEAT_POSITION_DUPLICATE');

        await this._seats.create({
            room: roomId,
            row_identifier: rowIdentifier,
            column_number: columnNumber,
            seat_category: seatCategory,
            seat_condition: seatCondition,
            status: 1,
        });

        return null;
    }

    // --- HU-OPERATIVA-10 / HU-OPERATIVA-11: Actualizar condición y/o categoría ---
    async updateSeat(seatId: number, body: { seatCondition?: number; seatCategory?: number }) {
        const { seatCondition, seatCategory } = body;

        if (seatCondition === undefined && seatCategory === undefined)
            throw new ValidationError('Debe enviar al menos seatCondition o seatCategory', []);

        await this._getActiveSeat(seatId);

        // Si se inhabilita (condición != 1 = activo), verificar tickets futuros
        if (seatCondition !== undefined && seatCondition !== 1) {
            const hasFuture = await this._hasFutureTickets(seatId);
            if (hasFuture)
                throw new ConflictError(
                    'No se puede modificar el asiento porque tiene boletos vendidos en funciones futuras.',
                    'SEAT_HAS_FUTURE_TICKETS',
                );
        }

        const updateData: any = {};
        if (seatCondition !== undefined) updateData.seat_condition = seatCondition;
        if (seatCategory !== undefined) updateData.seat_category = seatCategory;

        await this._seats.update(seatId, updateData);
        return null;
    }

    // --- HU-OPERATIVA-09 (Remoción): Soft Delete de asiento ---
    async deleteSeat(seatId: number) {
        await this._getActiveSeat(seatId);

        const hasFuture = await this._hasFutureTickets(seatId);
        if (hasFuture)
            throw new ConflictError(
                'No se puede eliminar el asiento porque tiene boletos vendidos en funciones futuras.',
                'SEAT_HAS_FUTURE_TICKETS',
            );

        await this._seats.update(seatId, { status: 4 });
        return null;
    }
}

export default new SeatsService();
