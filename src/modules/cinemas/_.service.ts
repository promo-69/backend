import { BaseService } from '@bases/service.base.js';
import { Database } from '@database/index.js';
import { ConflictError, NotFoundError, ValidationError } from '@errors';
import { type ProcessedQueryFilters } from '@rules/api-query.type.js';
import { type Transaction } from 'sequelize';

interface CreateCinemaBody {
	name: string;
	address?: string;
	phone?: string;
	openingTime: string; // HH:MM
	closingTime: string; // HH:MM
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
			// La auditoría nunca debe bloquear la operación principal
		}
	}

	private _validateTimeFormat(time: string, fieldName: string): void {
		if (!TIME_REGEX.test(time))
			throw new ValidationError(`El campo '${fieldName}' debe tener formato HH:MM (ej: 09:00)`, [fieldName]);
	}

	// --- HU-OPERATIVA-04: Registrar sucursal ---
	async createCinema(body: CreateCinemaBody, actorUserId?: number) {
		const { name, address, phone, openingTime, closingTime } = body;

		this.validateRequired({ name, openingTime, closingTime } as any, ['name', 'openingTime', 'closingTime']);
		this._validateTimeFormat(openingTime, 'openingTime');
		this._validateTimeFormat(closingTime, 'closingTime');

		if (openingTime > closingTime)
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

		//await this._writeAudit('cinemas', created.id, 'CREATE', null, created, actorUserId);

		return this._cinemas.getFull(created.id);
	}

	// --- HU-OPERATIVA-05: Modificar sucursal ---
	async updateCinema(id: number, body: UpdateCinemaBody, actorUserId?: number) {
		const cinema = await this._cinemas.getFull(id);
		if (!cinema) throw new NotFoundError('Sucursal no encontrada');

		const { name, address, phone, openingTime, closingTime } = body;
		const updateData: Record<string, any> = {};

		if (name !== undefined && name !== cinema.name) {
			const existing = await this._cinemas.getByName(name);
			if (existing && existing.id !== id)
				throw new ConflictError('Ya existe una sucursal con ese nombre', 'CINEMA_NAME_DUPLICATE');
			updateData.name = name;
		}

		if (address !== undefined) updateData.address = address;
		if (phone !== undefined) updateData.phone = phone;

		const newOpening = openingTime ?? cinema.opening_time;
		const newClosing = closingTime ?? cinema.closing_time;

		if (openingTime !== undefined) {
			this._validateTimeFormat(openingTime, 'openingTime');
			updateData.opening_time = openingTime;
		}
		if (closingTime !== undefined) {
			this._validateTimeFormat(closingTime, 'closingTime');
			updateData.closing_time = closingTime;
		}

		if (newOpening >= newClosing)
			throw new ValidationError('El horario de cierre debe ser posterior al de apertura', ['closingTime']);

		if (Object.keys(updateData).length === 0)
			throw new ValidationError('No se proporcionaron datos para actualizar', []);

		await this._writeAudit('cinemas', id, 'UPDATE', cinema, { ...cinema, ...updateData }, actorUserId);
		await this._cinemas.update(id, updateData);

		return this._cinemas.getFull(id);
	}

	// --- HU-OPERATIVA-06: Eliminar sucursal ---
	async deleteCinema(id: number, actorUserId?: number) {
		const cinema = await this._cinemas.getFull(id);
		if (!cinema) throw new NotFoundError('Sucursal no encontrada');

		const activeRooms = await this._rooms.getAllByCinema(id);
		if (activeRooms?.rows?.length > 0)
			throw new ConflictError(
				'No se puede eliminar la sucursal porque tiene salas activas. Elimínelas primero.',
				'CINEMA_HAS_ACTIVE_ROOMS',
			);

		await this._writeAudit('cinemas', id, 'DELETE', cinema, null, actorUserId);
		await this._cinemas.delete(id);

		return { id, deleted: true };
	}

	// --- Consultas ---
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
