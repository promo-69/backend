import { BaseService } from '@bases/service.base.js';
import { Database, Ops } from '@database/index.js';
import { ConflictError, NotFoundError, ValidationError } from '@errors';
import { type ProcessedQueryFilters } from '@rules/api-query.type.js';
import { type Transaction } from 'sequelize';

interface CreateCinemaBody {
	name: string;
	address?: string;
	phone?: string;
	openingTime: string;
	closingTime: string;
}

interface UpdateCinemaBody {
	name?: string;
	address?: string;
	phone?: string;
	openingTime?: string;
	closingTime?: string;
}

const TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;

export class CinemasService extends BaseService {
	constructor() {
		super();
	}

	private get _cinemas() {
		return Database.repository('main', 'cinemas') as any;
	}
	private get _rooms() {
		return Database.repository('main', 'rooms') as any;
	}
	private get _employeePositions() {
		return Database.repository('main', 'employee-positions') as any;
	}
	private get _roomBookings() {
		return Database.repository('main', 'room-bookings') as any;
	}
	private get _showtimes() {
		return Database.repository('main', 'showtimes') as any;
	}
	private get _tickets() {
		return Database.repository('main', 'tickets') as any;
	}
	private get _orders() {
		return Database.repository('main', 'orders') as any;
	}
	private get _orderLines() {
		return Database.repository('main', 'order-lines') as any;
	}
	private get _inventories() {
		return Database.repository('main', 'inventories') as any;
	}
	private get _combos() {
		return Database.repository('main', 'combos') as any;
	}

	private _validateTimeFormat(time: string, fieldName: string): void {
		if (!TIME_REGEX.test(time))
			throw new ValidationError(`El campo '${fieldName}' debe tener formato HH:MM (ej: 09:00)`, [fieldName]);
	}

	async createCinema(body: CreateCinemaBody, actorUserId?: number) {
		const { name, address, phone, openingTime, closingTime } = body;

		this.validateRequired({ name, openingTime, closingTime } as any, ['name', 'openingTime', 'closingTime']);
		this._validateTimeFormat(openingTime, 'openingTime');
		this._validateTimeFormat(closingTime, 'closingTime');

		if (openingTime >= closingTime)
			throw new ValidationError('El horario de cierre debe ser posterior al de apertura', ['closingTime']);

		const existing = await this._cinemas.getByName(name);
		if (existing) throw new ConflictError('Ya existe una sucursal con ese nombre', 'CINEMA_NAME_DUPLICATE');

		const created = await this._cinemas.create({
			name,
			address: address ?? null,
			phone: phone ?? null,
			opening_time: openingTime,
			closing_time: closingTime,
		});

		return this._cinemas.getFull(created.id);
	}

	async updateCinema(id: number, body: UpdateCinemaBody, actorUserId?: number, restricted = false) {
		return this._cinemas.transaction(async (transaction: Transaction) => {
			const cinema = await this._cinemas.getById(id, {
				transaction,
				lock: transaction.LOCK.UPDATE,
			});
			if (!cinema) throw new NotFoundError('Sucursal no encontrada');

			const { name, address, phone, openingTime, closingTime } = body;
			const updateData: Record<string, any> = {};

			if (restricted) {
				if (phone !== undefined) updateData.phone = phone;
				if (openingTime !== undefined) {
					this._validateTimeFormat(openingTime, 'openingTime');
					updateData.opening_time = openingTime;
				}
				if (closingTime !== undefined) {
					this._validateTimeFormat(closingTime, 'closingTime');
					updateData.closing_time = closingTime;
				}
			} else {
				if (name !== undefined && name !== cinema.name) {
					const existing = await this._cinemas.getByName(name);
					if (existing && existing.id !== id)
						throw new ConflictError('Ya existe una sucursal con ese nombre', 'CINEMA_NAME_DUPLICATE');
					updateData.name = name;
				}
				if (address !== undefined) updateData.address = address;
				if (phone !== undefined) updateData.phone = phone;
				if (openingTime !== undefined) {
					this._validateTimeFormat(openingTime, 'openingTime');
					updateData.opening_time = openingTime;
				}
				if (closingTime !== undefined) {
					this._validateTimeFormat(closingTime, 'closingTime');
					updateData.closing_time = closingTime;
				}
			}

			if (Object.keys(updateData).length > 0) {
				const newOpen = (updateData.opening_time as string) ?? cinema.opening_time;
				const newClose = (updateData.closing_time as string) ?? cinema.closing_time;
				if (newOpen >= newClose)
					throw new ValidationError('El horario de cierre debe ser posterior al de apertura', [
						'closingTime',
					]);
			}

			if (Object.keys(updateData).length === 0)
				throw new ValidationError('No se proporcionaron datos para actualizar', []);

			await this._cinemas.update(id, updateData, { transaction });
		});
	}

	async deleteCinema(id: number) {
		return this._cinemas.transaction(async (transaction: Transaction) => {
			const cinema = await this._cinemas.getById(id, {
				transaction,
				lock: transaction.LOCK.UPDATE,
			});
			if (!cinema) throw new NotFoundError('Sucursal no encontrada');

			// Regla 1: Empleados activos
			const activeEmployees = await this._employeePositions.count(
				{
					cinema: id,
					deleted_at: null,
					end_date: null,
				},
				{ transaction },
			);
			if (activeEmployees > 0) {
				throw new ConflictError(
					'No se puede eliminar la sucursal porque tiene empleados activos asignados.',
					'CINEMA_HAS_ACTIVE_EMPLOYEES',
				);
			}

			// Entidades Base: Salas y Reservas
			const rooms = await this._rooms.getAll(
				{ count: false, attributes: ['id'] },
				{ cinema: id, deleted_at: null },
				{ transaction }
			);
			const roomIds = (Array.isArray(rooms) ? rooms : rooms.rows || []).map((r: any) => r.id);

			let bookingIds: number[] = [];
			let activeBookingIds: number[] = [];
			
			if (roomIds.length > 0) {
				const bookings = await this._roomBookings.getAll(
					{ count: false, attributes: ['id', 'end_time'] },
					{ room: roomIds, deleted_at: null },
					{ transaction }
				);
				const bookingsArr = Array.isArray(bookings) ? bookings : bookings.rows || [];
				bookingIds = bookingsArr.map((b: any) => b.id);
				
				const now = new Date();
				activeBookingIds = bookingsArr
					.filter((b: any) => new Date(b.end_time) > now)
					.map((b: any) => b.id);
			}

			// Regla 2: Boletos válidos en funciones activas
			if (activeBookingIds.length > 0) {
				const activeTickets = await this._tickets.getAll(
					{ count: false, attributes: ['id', 'order'] },
					{ booking: activeBookingIds, deleted_at: null },
					{ transaction }
				);
				const ticketsArr = Array.isArray(activeTickets) ? activeTickets : activeTickets.rows || [];
				
				if (ticketsArr.length > 0) {
					const orderIds = [...new Set(ticketsArr.map((t: any) => t.order))];
					
					const validOrders = await this._orders.count(
						{
							id: orderIds,
							order_status: { [Ops.ne]: 3 }, // 3 = Cancelada
							deleted_at: null,
						},
						{ transaction }
					);

					if (validOrders > 0) {
						throw new ConflictError(
							'No se puede eliminar la sucursal porque existen boletos vendidos para funciones activas.',
							'CINEMA_HAS_ACTIVE_TICKETS'
						);
					}
				}
			}

			// Regla 3: Confitería pendiente por entregar
			const pendingOrders = await this._orders.getAll(
				{ count: false, attributes: ['id'] },
				{
					cinema: id,
					order_status: [1, 2], // Pendiente de pago o Pagada
					concessions_validated_at: null,
					deleted_at: null,
				},
				{ transaction }
			);
			const pendingOrderIds = (Array.isArray(pendingOrders) ? pendingOrders : pendingOrders.rows || []).map((o: any) => o.id);

			if (pendingOrderIds.length > 0) {
				const pendingConcessions = await this._orderLines.count(
					{
						order: pendingOrderIds,
						line_type: [1, 2], // Producto o Combo
						deleted_at: null,
					},
					{ transaction }
				);

				if (pendingConcessions > 0) {
					throw new ConflictError(
						'No se puede eliminar la sucursal porque hay órdenes de confitería pendientes por entregar.',
						'CINEMA_HAS_PENDING_CONCESSIONS'
					);
				}
			}

			// Eliminación Lógica en Cascada
			const deletedAt = new Date();

			// Inventarios y Combos
			await this._inventories.update({ cinema: id, deleted_at: null }, { deleted_at: deletedAt }, { transaction });
			await this._combos.update({ cinema: id, deleted_at: null }, { deleted_at: deletedAt }, { transaction });

			// Showtimes y Room Bookings
			if (bookingIds.length > 0) {
				await this._showtimes.update({ booking: bookingIds, deleted_at: null }, { deleted_at: deletedAt }, { transaction });
				await this._roomBookings.update({ id: bookingIds, deleted_at: null }, { deleted_at: deletedAt }, { transaction });
			}

			// Rooms
			if (roomIds.length > 0) {
				await this._rooms.update({ id: roomIds, deleted_at: null }, { deleted_at: deletedAt }, { transaction });
			}

			// Finalmente la Sucursal
			await this._cinemas.delete(id, { transaction });
		});
	}

	async findAll(filters?: ProcessedQueryFilters) {
		return this._cinemas.getAllFull(filters);
	}

	async findById(id: number) {
		const cinema = await this._cinemas.getFull(id);
		if (!cinema) throw new NotFoundError('Sucursal no encontrada');
		return cinema;
	}
}

export default new CinemasService();
