import { BaseService } from '@bases/service.base.js';
import { Database } from '@database/index.js';
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

	// setCinemaStatus eliminado: la tabla cinemas NO tiene columna 'status' en la migración.
	// La eliminación lógica se hace via deleted_at (soft delete).
	async deleteCinema(id: number) {
		return this._cinemas.transaction(async (transaction: Transaction) => {
			const cinema = await this._cinemas.getById(id, {
				transaction,
				lock: transaction.LOCK.UPDATE,
			});
			if (!cinema) throw new NotFoundError('Sucursal no encontrada');

			// Verificar que no tenga salas activas
			const activeRooms = await this._rooms.count({ cinema: id, deleted_at: null }, { transaction });
			if (activeRooms > 0)
				throw new ConflictError(
					'No se puede eliminar la sucursal porque tiene salas activas',
					'CINEMA_HAS_ACTIVE_ROOMS',
				);

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
