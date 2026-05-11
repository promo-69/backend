import { BaseService } from '@bases/service.base.js';
import { Database } from '@database/index.js';
import { ConflictError, NotFoundError, ValidationError } from '@errors';
import { type ProcessedQueryFilters } from '@rules/api-query.type.js';
import { type Transaction } from 'sequelize';

interface CreateRoomBody {
	cinemaId: number;
	name: string;
	projectionTypes: number[];
	gridRows: number;
	gridColumns: number;
	totalCapacity: number;
}

interface UpdateRoomBody {
	name?: string;
	totalCapacity?: number;
	projectionTypes?: number[];
}

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

	// --- HU-OPERATIVA-07: Registrar sala (SIN generar asientos) ---
	async createRoom(body: CreateRoomBody, actorUserId?: number) {
		const { cinemaId, name, projectionTypes, gridRows, gridColumns, totalCapacity } = body;

		this.validateRequired({ cinemaId, name, projectionTypes, gridRows, gridColumns, totalCapacity } as any, [
			'cinemaId',
			'name',
			'projectionTypes',
			'gridRows',
			'gridColumns',
			'totalCapacity',
		]);

		if (!Array.isArray(projectionTypes) || projectionTypes.length === 0)
			throw new ValidationError('Debe especificar al menos un tipo de proyección', ['projectionTypes']);

		if (!Number.isInteger(gridRows) || gridRows < 1)
			throw new ValidationError('El número de filas debe ser un entero mayor a 0', ['gridRows']);

		if (!Number.isInteger(gridColumns) || gridColumns < 1)
			throw new ValidationError('El número de columnas debe ser un entero mayor a 0', ['gridColumns']);

		if (typeof totalCapacity !== 'number' || totalCapacity < 0)
			throw new ValidationError('La capacidad total no puede ser negativa', ['totalCapacity']);

		const cinema = await this._cinemas.getFull(cinemaId);
		if (!cinema || cinema.status !== 1) throw new NotFoundError('Sucursal no encontrada o inactiva');

		const existing = await this._rooms.getByNameAndCinema(name, cinemaId);
		if (existing && existing.status === 1)
			throw new ConflictError('Ya existe una sala con ese nombre en la sucursal', 'ROOM_NAME_DUPLICATE');

		const createdRoom = await this._rooms.transaction(async (transaction: Transaction) => {
			const room = await this._rooms.create(
				{
					cinema: cinemaId,
					name,
					grid_rows: gridRows,
					grid_columns: gridColumns,
					total_capacity: totalCapacity,
					status: 1,
				},
				{ transaction },
			);

			const projectionRecords = projectionTypes.map((ptId: number) => ({
				room: room.id,
				projection_type: ptId,
				status: 1,
			}));
			await this._roomProjectionTypes.bulkCreate(projectionRecords, { transaction });

			return room;
		});

		return { room_id: createdRoom.id, name: createdRoom.name };
	}

	// --- HU-OPERATIVA-08: Modificar sala ---
	async updateRoom(id: number, body: UpdateRoomBody) {
		const room = await this._rooms.getFull(id);
		if (!room || room.status !== 1) throw new NotFoundError('Sala no encontrada');

		const { name, totalCapacity, projectionTypes } = body;
		const updateData: Record<string, any> = {};

		if (name !== undefined) {
			if (typeof name !== 'string' || name.trim().length === 0)
				throw new ValidationError('El nombre no puede estar vacío', ['name']);
			const existing = await this._rooms.getByNameAndCinema(name, room.cinema);
			if (existing && existing.id !== id && existing.status === 1)
				throw new ConflictError('Ya existe una sala con ese nombre en la sucursal', 'ROOM_NAME_DUPLICATE');
			updateData.name = name.trim();
		}

		if (totalCapacity !== undefined) {
			if (typeof totalCapacity !== 'number' || totalCapacity < 0)
				throw new ValidationError('La capacidad total no puede ser negativa', ['totalCapacity']);
			updateData.total_capacity = totalCapacity;
		}

		if (Object.keys(updateData).length === 0 && projectionTypes === undefined)
			throw new ValidationError('No se proporcionaron datos para actualizar', []);

		await this._rooms.transaction(async (transaction: Transaction) => {
			if (Object.keys(updateData).length > 0) await this._rooms.update(id, updateData, { transaction });

			if (projectionTypes !== undefined) {
				await this._roomProjectionTypes.deleteByRoom(id, { transaction });
				if (projectionTypes.length > 0) {
					const records = projectionTypes.map((ptId: number) => ({
						room: id,
						projection_type: ptId,
						status: 1,
					}));
					await this._roomProjectionTypes.bulkCreate(records, { transaction });
				}
			}
		});

		return null;
	}

	// --- HU-OPERATIVA-08 (Adición): Eliminar sala (Soft Delete) ---
	async deleteRoom(id: number) {
		const room = await this._rooms.getFull(id);
		if (!room || room.status !== 1) throw new NotFoundError('Sala no encontrada');

		let activeShowtimes = 0;
		try {
			activeShowtimes = await Database.repository('main', 'showtimes').count({ room: id, status: 1 } as any);
		} catch {
			/* módulo showtimes aún no implementado, se ignora */
		}

		if (activeShowtimes > 0)
			throw new ConflictError(
				'No se puede clausurar la sala porque tiene funciones futuras activas.',
				'ROOM_HAS_ACTIVE_SHOWTIMES',
			);

		await this._rooms.update(id, { status: 4 });
		return null;
	}

	// --- Soporte Visual Frontend: Mapa de asientos ---
	async getSeatMap(roomId: number, filters?: ProcessedQueryFilters) {
		const room = await this._rooms.getFull(roomId);
		if (!room || room.status !== 1) throw new NotFoundError('Sala no encontrada');
		return this._seats.getAllByRoom(roomId, filters);
	}

	// --- Consultas generales ---
	async findAll(cinemaId?: number, filters?: ProcessedQueryFilters) {
		if (cinemaId === undefined) {
			return this._rooms.getAll(filters || {});
		}

		const cinema = await this._cinemas.getFull(cinemaId);
		if (!cinema || cinema.status !== 1) throw new NotFoundError('Sucursal no encontrada');
		return this._rooms.getAllByCinema(cinemaId, filters);
	}

	async findRoomProjectionTypes(roomId: number, filters?: ProcessedQueryFilters) {
		await this.findById(roomId);
		return this._roomProjectionTypes.getByRoom(roomId);
	}

	async findRoomProjectionTypeById(id: number, roomId: number) {
		const projectionType = await this._roomProjectionTypes.getById(id);
		return projectionType && projectionType.room === roomId ? projectionType : null;
	}

	async createRoomProjectionType(roomId: number, projectionTypeData: any) {
		await this.findById(roomId);

		const projectionType = projectionTypeData.projectionType;
		if (!Number.isInteger(projectionType) || projectionType <= 0)
			throw new ValidationError('projectionType must be a positive integer', ['projectionType']);

		return this._roomProjectionTypes.create({
			room: roomId,
			projection_type: projectionType,
			status: 1,
		});
	}

	async deleteRoomProjectionType(id: number, roomId: number) {
		await this.findById(roomId);
		const projectionType = await this.findRoomProjectionTypeById(id, roomId);
		if (!projectionType) throw new NotFoundError('RoomProjectionType', id);
		return this._roomProjectionTypes.update(id, { status: 4 });
	}

	async findById(id: number) {
		const room = await this._rooms.getFull(id);
		if (!room || room.status !== 1) throw new NotFoundError('Sala no encontrada');
		return room;
	}
}

export default new RoomsService();
