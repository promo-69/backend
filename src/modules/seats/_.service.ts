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

	private async _getActiveSeat(seatId: number, transaction?: Transaction, lock?: boolean) {
		const seat = await this._seats.getById(seatId, {
			transaction,
			lock: lock ? transaction?.LOCK?.UPDATE : undefined,
		});
		if (!seat) throw new NotFoundError('Asiento no encontrado');
		return seat;
	}

	/**
	 * Verifica si el asiento tiene tickets vendidos para funciones futuras.
	 * Filtra por showtimes con start_time > NOW() y no cancelados.
	 */
	private async _hasFutureTickets(seatId: number, transaction?: Transaction): Promise<boolean> {
		// Obtener los IDs de showtimes futuros
		const futureShowtimes = await this._showtimes.getAll(
			{
				count: false,
				attributes: ['id'],
				where: {
					start_time: { [Op.gt]: new Date() },
					deleted_at: null,
				},
			},
			{},
			{ transaction },
		);
		const showtimeIds = (Array.isArray(futureShowtimes) ? futureShowtimes : futureShowtimes.rows).map(
			(s: any) => s.id,
		);

		if (showtimeIds.length === 0) return false;

		// Contar tickets para este asiento en esos showtimes
		const count = await this._tickets.count(
			{
				seat: seatId,
				deleted_at: null,
			},
			{
				transaction,
				relations: [{ as: '_RoomBookings', where: { showtime: { [Op.in]: showtimeIds } } }],
			},
		);

		return count > 0;
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

			// Validar posición dentro del grid
			const rowIndex = rowIdentifier.charCodeAt(0) - 'A'.charCodeAt(0) + 1; // A=1, B=2, ...
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

			// Verificar duplicado
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

		if (errors.length > 0) {
			throw new ValidationError(`Errores de validación: ${errors.join('; ')}`, []);
		}

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

	// --- PATCH /seats/:id (concurrencia + validación de tickets futuros) ---
	async updateSeat(seatId: number, body: { seatCondition?: number; seatCategory?: number }) {
		const { seatCondition, seatCategory } = body;

		if (seatCondition === undefined && seatCategory === undefined)
			throw new ValidationError('Debe enviar al menos seatCondition o seatCategory', []);

		await this._seats.transaction(async (transaction: Transaction) => {
			await this._getActiveSeat(seatId, transaction, true); // lock

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

			return await this._seats.update(seatId, updateData, { transaction });
		});

		return await this._getActiveSeat(seatId);
	}

	// --- DELETE /seats/:id (concurrencia + validación de tickets futuros) ---
	async deleteSeat(seatId: number) {
		await this._seats.transaction(async (transaction: Transaction) => {
			const seat = await this._getActiveSeat(seatId, transaction, true); // lock

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
}

export default new SeatsService();
