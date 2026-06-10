import { Database } from '@database/index.js';
import { ConflictError, NotFoundError, ValidationError } from '@errors';
import { Transaction, Op } from 'sequelize';

export class SeatManagementService {
	private get _rooms() {
		return Database.repository('main', 'rooms') as any;
	}
	private get _seats() {
		return Database.repository('main', 'seats') as any;
	}
	private get _roomBookings() {
		return Database.repository('main', 'room-bookings') as any;
	}
	private get _tickets() {
		return Database.repository('main', 'tickets') as any;
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

	async bulkUpdateSeats(
		roomId: number,
		seats: Array<{
			seatId: number;
			seatCategoryId?: number;
			seatConditionId?: number;
		}>,
	) {
		if (!roomId) throw new ValidationError('Debe proporcionar el ID de la sala');
		if (!Array.isArray(seats) || seats.length === 0) {
			throw new ValidationError('El payload debe ser un arreglo con al menos un asiento a actualizar');
		}

		const room = await this._rooms.getById(roomId, {
			attributes: ['id'],
		});
		if (!room) throw new NotFoundError('No se encontró la sala especificada');

		// Extract ids to check
		const seatIds = seats.map((s) => s.seatId);
		if (seatIds.some((id) => !id)) {
			throw new ValidationError('Cada objeto de asiento debe contener la propiedad seatId');
		}

		const ticketsWithActiveOrders = await this._tickets.getAll(
			{
				count: true,
				attributes: ['id'],
				relations: [
					{
						association: '_RoomBookings',
						required: true,
						attributes: [],
						where: {
							end_time: { [Op.gt]: new Date() },
							deleted_at: null,
						},
					},
					{
						association: '_Orders',
						required: true,
						attributes: [],
						where: {
							order_status: { [Op.ne]: 3 }, // 3 is CANCELLED
							deleted_at: null,
						},
					},
				],
			},
			{
				seat: seatIds,
				deleted_at: null,
			},
		);

		const activeTicketsCount = Array.isArray(ticketsWithActiveOrders)
			? ticketsWithActiveOrders.length
			: ticketsWithActiveOrders.count;

		if (activeTicketsCount > 0) {
			throw new ConflictError(
				'No se pueden modificar porque uno o más asientos seleccionados tienen tickets en órdenes activas para funciones o reservas que aún no han concluido',
				'SEAT_HAS_ACTIVE_TICKETS',
			);
		}

		return this._seats.transaction(async (transaction: Transaction) => {
			const updatedSeats: any[] = [];
			for (const seat of seats) {
				const existing = await this._seats.getById(seat.seatId, { transaction, lock: transaction.LOCK.UPDATE });
				if (!existing) {
					throw new NotFoundError(`No se encontró el asiento con ID ${seat.seatId}`);
				}
				if (Number(existing.room) !== Number(roomId)) {
					throw new ValidationError(
						`El asiento con ID ${seat.seatId} no pertenece a la sala con ID ${roomId}`,
					);
				}

				const updatePayload: any = {};
				if (seat.seatCategoryId !== undefined) updatePayload.seat_category = seat.seatCategoryId;
				if (seat.seatConditionId !== undefined) updatePayload.seat_condition = seat.seatConditionId;

				if (Object.keys(updatePayload).length > 0) {
					const updated = await this._seats.update(seat.seatId, updatePayload, { transaction });
					updatedSeats.push(updated);
				} else {
					updatedSeats.push(existing);
				}
			}
			return updatedSeats;
		});
	}
}

export default new SeatManagementService();
