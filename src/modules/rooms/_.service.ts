import { BaseService } from '@bases/service.base.js';
import { Database } from '@database/index.js';
import { ConflictError, NotFoundError, ValidationError } from '@errors';
import { type ProcessedQueryFilters } from '@rules/api-query.type.js';
import { type Transaction, Op } from 'sequelize';

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
	private get _showtimes() {
		return Database.repository('main', 'showtimes') as any;
	}

	/** Capacidad total real = número de asientos activos */
	private async _getRoomTotalCapacity(roomId: number, transaction?: Transaction): Promise<number> {
		return this._seats.count({ room: roomId, seat_condition: 1, deleted_at: null }, { transaction });
	}

	private async _attachTotalCapacity(room: any) {
		const capacity = await this._getRoomTotalCapacity(room.id);
		return { ...room, total_capacity: capacity };
	}

	private _validateProjectionTypes(projectionTypes: any, required = true, field = 'projectionTypes') {
		if (!Array.isArray(projectionTypes) || (required && projectionTypes.length === 0)) {
			throw new ValidationError('Debe especificar al menos un tipo de proyección', [field]);
		}

		if (!Array.isArray(projectionTypes)) {
			throw new ValidationError('projectionTypes debe ser un arreglo de enteros positivos', [field]);
		}

		const invalidIndex = projectionTypes.findIndex((pt: any) => !Number.isInteger(pt) || pt <= 0);

		if (invalidIndex !== -1) {
			throw new ValidationError('Todos los tipos de proyección deben ser enteros positivos', [field]);
		}
	}

	// --- HU-OPERATIVA-07: Registrar sala (sin totalCapacity explícito) ---
	async createRoom(cinemaId: number, body: any, actorUserId?: number) {
		const { name, projectionTypes, gridRows, gridColumns } = body;

		this.validateRequired({ name, projectionTypes, gridRows, gridColumns }, [
			'name',
			'projectionTypes',
			'gridRows',
			'gridColumns',
		]);

		const trimmedName = typeof name === 'string' ? name.trim() : '';
		if (!trimmedName) throw new ValidationError('El nombre de la sala es obligatorio', ['name']);

		this._validateProjectionTypes(projectionTypes);

		if (!Number.isInteger(gridRows) || gridRows < 1)
			throw new ValidationError('El número de filas debe ser un entero mayor a 0', ['gridRows']);

		if (!Number.isInteger(gridColumns) || gridColumns < 1)
			throw new ValidationError('El número de columnas debe ser un entero mayor a 0', ['gridColumns']);

		const cinema = await this._cinemas.getFull(cinemaId);
		if (!cinema) throw new NotFoundError('Sucursal no encontrada');

		const existing = await this._rooms.getByNameAndCinema(trimmedName, cinemaId);
		if (existing)
			throw new ConflictError('Ya existe una sala con ese nombre en la sucursal', 'ROOM_NAME_DUPLICATE');

		const createdRoom = await this._rooms.transaction(async (transaction: Transaction) => {
			const room = await this._rooms.create(
				{
					cinema: cinemaId,
					name: trimmedName,
					grid_rows: gridRows,
					grid_columns: gridColumns,
				},
				{ transaction },
			);

			const projectionRecords = projectionTypes.map((ptId: number) => ({
				room: room.id,
				projection_type: ptId,
			}));
			await this._roomProjectionTypes.bulkCreate(projectionRecords, { transaction });

			return room;
		});

		return { room_id: createdRoom.id, name: createdRoom.name };
	}

	// --- HU-OPERATIVA-08: Modificar sala (PATCH) ---
	async updateRoom(id: number, body: any) {
		const { name, projectionTypes } = body;

		if (name === undefined && projectionTypes === undefined) {
			throw new ValidationError('No se proporcionaron datos para actualizar', []);
		}

		await this._rooms.transaction(async (transaction: Transaction) => {
			const room = await this._rooms.getById(id, { transaction, lock: transaction.LOCK.UPDATE });
			if (!room) throw new NotFoundError('Sala no encontrada');

			const updateData: Record<string, any> = {};

			if (name !== undefined) {
				if (typeof name !== 'string' || name.trim().length === 0)
					throw new ValidationError('El nombre no puede estar vacío', ['name']);
				const existing = await this._rooms.getByNameAndCinema(name.trim(), room.cinema);
				if (existing && existing.id !== id)
					throw new ConflictError('Ya existe una sala con ese nombre en la sucursal', 'ROOM_NAME_DUPLICATE');
				updateData.name = name.trim();
			}

			if (Object.keys(updateData).length > 0) {
				await this._rooms.update(id, updateData, { transaction });
			}

			if (projectionTypes !== undefined) {
				if (!Array.isArray(projectionTypes))
					throw new ValidationError('projectionTypes debe ser un arreglo de enteros positivos', [
						'projectionTypes',
					]);

				this._validateProjectionTypes(projectionTypes, false);

				// Validar funciones futuras antes de eliminar tipos de proyección
				const currentTypes = await this._roomProjectionTypes.getAll(
					{ count: false },
					{ room: id },
					{ transaction },
				);
				const currentTypeIds = (Array.isArray(currentTypes) ? currentTypes : currentTypes.rows).map(
					(r: any) => r.projection_type,
				);

				const typesToRemove = currentTypeIds.filter((ptId: number) => !projectionTypes.includes(ptId));
				if (typesToRemove.length > 0) {
					const futureCount = await this._showtimes.count(
						{
							room: id,
							start_time: { [Op.gt]: new Date() },
							projection_type: typesToRemove,
							deleted_at: null,
						},
						{ transaction },
					);
					if (futureCount > 0)
						throw new ValidationError(
							'No se pueden quitar tipos de proyección con funciones futuras programadas',
							['projectionTypes'],
						);
				}

				await this._roomProjectionTypes.deleteByRoom(id, { transaction });
				if (projectionTypes.length > 0) {
					const records = projectionTypes.map((ptId: number) => ({
						room: id,
						projection_type: ptId,
					}));
					await this._roomProjectionTypes.bulkCreate(records, { transaction });
				}
			}
		});

		return null;
	}

	// --- HU-OPERATIVA-08 (Adición): Eliminar sala ---
	async deleteRoom(id: number) {
		await this._rooms.transaction(async (transaction: Transaction) => {
			const room = await this._rooms.getById(id, { transaction, lock: transaction.LOCK.UPDATE });
			if (!room) throw new NotFoundError('Sala no encontrada');

			const activeShowtimes = await this._showtimes.count(
				{
					room: id,
					start_time: { [Op.gt]: new Date() },
					deleted_at: null,
				},
				{ transaction },
			);
			if (activeShowtimes > 0)
				throw new ConflictError(
					'No se puede clausurar la sala porque tiene funciones activas',
					'ROOM_HAS_ACTIVE_SHOWTIMES',
				);

			await this._rooms.delete(id, { transaction });
		});
		return null;
	}

	// --- Consultas ---
	async findAll(cinemaId?: number, filters?: ProcessedQueryFilters) {
		let rooms: any;
		if (cinemaId === undefined) {
			rooms = await this._rooms.getAll(filters || {});
		} else {
			const cinema = await this._cinemas.getFull(cinemaId);
			if (!cinema) throw new NotFoundError('Sucursal no encontrada');
			rooms = await this._rooms.getAllByCinema(cinemaId, filters);
		}

		const attach = async (r: any) => this._attachTotalCapacity(r);
		if (Array.isArray(rooms)) {
			return Promise.all(rooms.map(attach));
		}
		return {
			...rooms,
			rows: await Promise.all((rooms.rows || []).map(attach)),
		};
	}

	async findById(id: number) {
		const room = await this._rooms.getFull(id);
		if (!room) throw new NotFoundError('Sala no encontrada');
		return this._attachTotalCapacity(room);
	}

	async getSeatMap(roomId: number, filters?: ProcessedQueryFilters) {
		const room = await this._rooms.getFull(roomId);
		if (!room) throw new NotFoundError('Sala no encontrada');
		return this._seats.getAllByRoom(roomId, filters);
	}

	// --- Tipos de proyección ---
	async findRoomProjectionTypes(roomId: number) {
		await this.findById(roomId);
		return this._roomProjectionTypes.getByRoom(roomId);
	}

	async createRoomProjectionType(roomId: number, projectionTypeId: number) {
		await this.findById(roomId);
		if (!Number.isInteger(projectionTypeId) || projectionTypeId <= 0)
			throw new ValidationError('projectionType debe ser un entero positivo', ['projectionType']);
		return this._roomProjectionTypes.create({ room: roomId, projection_type: projectionTypeId });
	}

	async deleteRoomProjectionType(roomId: number, projectionTypeId: number) {
		await this.findById(roomId);
		const record = await this._roomProjectionTypes.getOne({ room: roomId, id: projectionTypeId });
		if (!record) throw new NotFoundError('Tipo de proyección no encontrado en esta sala');
		return this._roomProjectionTypes.delete(record.id);
	}
}

export default new RoomsService();
