import { BaseService } from '@bases/service.base.js';
import { Database } from '@database/index.js';
import { ConflictError, NotFoundError, ValidationError } from '@errors';
import { type ProcessedQueryFilters } from '@rules/api-query.type.js';
import { type Transaction } from 'sequelize';

// IDs de lifecycle_state según seeder
const LIFECYCLE = { PROXIMAMENTE: 1, ESTRENO: 2, REGULAR: 3, ULTIMOS_DIAS: 4, FUERA: 5 };
const IN_CARTELERA = [LIFECYCLE.ESTRENO, LIFECYCLE.REGULAR, LIFECYCLE.ULTIMOS_DIAS];

interface CreateShowtimeBody {
	movieId: number;
	roomId: number;
	projectionTypeId: number;
	startTime: string; // ISO datetime
	currencyId: number;
	price: number;
	earnedLoyaltyPoints?: number;
}

interface UpdateShowtimeBody {
	startTime?: string;
	price?: number;
	currencyId?: number;
}

export class ShowtimesService extends BaseService {
	constructor() {
		super();
	}

	private get _showtimes() {
		return Database.repository('main', 'showtimes') as any;
	}
	private get _movies() {
		return Database.repository('main', 'movies') as any;
	}
	private get _rooms() {
		return Database.repository('main', 'rooms') as any;
	}
	private get _roomProjectionTypes() {
		return Database.repository('main', 'room-projection-types') as any;
	}

	private _calcEndTime(startTime: string, durationMinutes: number): Date {
		const start = new Date(startTime);
		return new Date(start.getTime() + durationMinutes * 60000);
	}

	private async _getActiveShowtime(id: number) {
		const st = await this._showtimes.getFull(id);
		if (!st) throw new NotFoundError('Función no encontrada');
		return st;
	}

	// --- HU-OPERATIVA-17: Crear horario ---
	// --- HU-OPERATIVA-22: Pase automático a "En Cartelera" al crear primera función ---
	async createShowtime(body: CreateShowtimeBody, actorUserId?: number) {
		const { movieId, roomId, projectionTypeId, startTime, currencyId, price, earnedLoyaltyPoints } = body;

		this.validateRequired({ movieId, roomId, projectionTypeId, startTime, currencyId, price } as any, [
			'movieId',
			'roomId',
			'projectionTypeId',
			'startTime',
			'currencyId',
			'price',
		]);

		if (typeof price !== 'number' || price <= 0)
			throw new ValidationError('El precio debe ser un número positivo', ['price']);

		const startDate = new Date(startTime);
		if (isNaN(startDate.getTime()))
			throw new ValidationError('El formato de startTime no es válido (use ISO 8601)', ['startTime']);

		if (startDate <= new Date())
			throw new ValidationError('La función debe programarse en el futuro', ['startTime']);

		const movie = await this._movies.getFull(movieId);
		if (!movie) throw new NotFoundError('Película no encontrada');

		const room = await this._rooms.getFull(roomId);
		if (!room) throw new NotFoundError('Sala no encontrada');

		// Verificar que la sala soporte ese tipo de proyección
		const roomPT = await this._roomProjectionTypes.getOne({
			room: roomId,
			projection_type: projectionTypeId,
		});
		if (!roomPT)
			throw new ConflictError(
				'La sala no soporta el tipo de proyección indicado',
				'ROOM_PROJECTION_TYPE_MISMATCH',
			);

		const endTime = this._calcEndTime(startTime, movie.duration_minutes);

		// Verificar conflicto de horario en la sala
		const conflict = await this._showtimes.hasConflict(roomId, startDate, endTime);
		if (conflict)
			throw new ConflictError('La sala ya tiene una función programada en ese horario', 'SHOWTIME_ROOM_CONFLICT');

		const created = await this._showtimes.transaction(async (transaction: Transaction) => {
			const showtime = await this._showtimes.create(
				{
					movie: movieId,
					room: roomId,
					projection_type: projectionTypeId,
					start_time: startDate,
					end_time: endTime,
					currency: currencyId,
					price,
					earned_loyalty_points: earnedLoyaltyPoints ?? null,
				},
				{ transaction },
			);

			// HU-OPERATIVA-22: Si la película es "Próximamente", pasa a "En Cartelera (Estreno)"
			if (movie.lifecycle_state === LIFECYCLE.PROXIMAMENTE) {
				await this._movies.update(movieId, { lifecycle_state: LIFECYCLE.ESTRENO }, { transaction });
			}

			return showtime;
		});

		return this._showtimes.getFull(created.id);
	}

	// --- HU-OPERATIVA-18: Modificar precio/horario ---
	async updateShowtime(id: number, body: UpdateShowtimeBody) {
		const showtime = await this._getActiveShowtime(id);
		const updateData: Record<string, any> = {};

		if (body.startTime !== undefined) {
			const startDate = new Date(body.startTime);
			if (isNaN(startDate.getTime()))
				throw new ValidationError('El formato de startTime no es válido', ['startTime']);
			if (startDate <= new Date())
				throw new ValidationError('La función debe reprogramarse en el futuro', ['startTime']);

			const movie = await this._movies.getFull(showtime.movie);
			const endTime = this._calcEndTime(body.startTime, movie.duration_minutes);

			const conflict = await this._showtimes.hasConflict(showtime.room, startDate, endTime, id);
			if (conflict)
				throw new ConflictError('La sala ya tiene una función en ese nuevo horario', 'SHOWTIME_ROOM_CONFLICT');

			updateData.start_time = startDate;
			updateData.end_time = endTime;
		}

		if (body.price !== undefined) {
			if (typeof body.price !== 'number' || body.price <= 0)
				throw new ValidationError('El precio debe ser un número positivo', ['price']);
			updateData.price = body.price;
		}

		if (body.currencyId !== undefined) updateData.currency = body.currencyId;

		if (Object.keys(updateData).length === 0)
			throw new ValidationError('No se proporcionaron datos para actualizar', []);

		await this._showtimes.update(id, updateData);
		return null;
	}

	// --- HU-OPERATIVA-19: Cancelar función ---
	async cancelShowtime(id: number) {
		await this._getActiveShowtime(id);
		await this._showtimes.delete(id);
		return null;
	}

	async findAll(filters?: ProcessedQueryFilters) {
		return this._showtimes.getAllFull(filters);
	}

	async findById(id: number) {
		return this._getActiveShowtime(id);
	}

	async findByMovie(movieId: number, filters?: ProcessedQueryFilters) {
		return this._showtimes.getAllByMovie(movieId, filters);
	}

	async findByRoom(roomId: number, filters?: ProcessedQueryFilters) {
		return this._showtimes.getAllByRoom(roomId, filters);
	}
}

export default new ShowtimesService();
