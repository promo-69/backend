import { Database, Ops } from '@database/index.js';
import { ConflictError, NotFoundError, ValidationError } from '@errors';
import { Transaction } from 'sequelize';
import { CacheDatabaseProvider } from '@providers/cache-database.provider.js';
import { PricingService } from '@services/pricing.service.js';
import { PricingCacheService } from '@services/pricing-cache.service.js';
import shoppingSessionService from '@services/shopping-session.service.js';

// IDs de booking_types (seed: 1='Película', 2='Evento Alternativo')
const BOOKING_TYPE_ID_SHOWTIME = 1;
const BOOKING_TYPE_ID_SPECIAL_EVENT = 2;

export class ShowtimeManagementService {
	private get _roomBookings() {
		return Database.repository('main', 'room-bookings') as any;
	}
	private get _showtimesRepo() {
		return Database.repository('main', 'showtimes') as any;
	}
	private get _movies() {
		return Database.repository('main', 'movies') as any;
	}
	private get _specialEvents() {
		return Database.repository('main', 'special-events') as any;
	}
	private get _tickets() {
		return Database.repository('main', 'tickets') as any;
	}
	private get _bookingTypes() {
		return Database.repository('main', 'booking-types') as any;
	}
	private get _movieSubscriptions() {
		return Database.repository('main', 'movie-user-subscriptions') as any;
	}
	private get _seats() {
		return Database.repository('main', 'seats') as any;
	}
	private get _rooms() {
		return Database.repository('main', 'rooms') as any;
	}
	private get _lifecycleStates() {
		return Database.repository('main', 'movie-lifecycle-states') as any;
	}

	// Cache para los IDs de estados visibles (se refresca en cada consulta)
	private async _getVisibleLifecycleStates(): Promise<number[]> {
		const states = await this._lifecycleStates.getAll({ count: false, attributes: ['id', 'description'] });
		const stateList = Array.isArray(states) ? states : states.rows || [];
		const excludedDescriptions = ['Fuera de Cartelera'];
		const visibleIds = stateList
			.filter((s: any) => !excludedDescriptions.includes(s.description))
			.map((s: any) => s.id);
		return visibleIds;
	}

	private async _getLifecycleStateIds(): Promise<Record<string, number>> {
		const states = await this._lifecycleStates.getAll({ count: false, attributes: ['id', 'description'] });
		const stateList = Array.isArray(states) ? states : states.rows || [];
		const map: Record<string, number> = {};
		for (const s of stateList) {
			map[s.description] = s.id;
		}
		return map;
	}

	// -------------------------------------------------------------------------
	//  PRIVADOS - VALIDACIÓN DE SOLAPAMIENTO
	// -------------------------------------------------------------------------
	private async _checkOverlap(
		roomId: number,
		startTime: Date,
		endTime: Date,
		excludeBookingId?: number,
		transaction?: Transaction,
	) {
		const where: any = {
			room: roomId,
			start_time: { [Ops.lt]: endTime },
			end_time: { [Ops.gt]: startTime },
			deleted_at: null,
		};
		if (excludeBookingId) {
			where.id = { [Ops.ne]: excludeBookingId };
		}
		const existingBooking = await this._roomBookings.getOne(where, { transaction });
		if (existingBooking) {
			throw new ConflictError('La sala ya está ocupada en ese horario', 'ROOM_ALREADY_BOOKED');
		}
	}

	// -------------------------------------------------------------------------
	//  CICLO DE VIDA - PELÍCULAS
	// -------------------------------------------------------------------------
	private async _syncMovieLifecycle(movieId: number, transaction?: Transaction) {
		const movie = await this._movies.getById(movieId, {
			attributes: ['id', 'release_date', 'lifecycle_state'],
			transaction,
		});
		if (!movie) return;

		const now = new Date();
		const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
		const releaseDate = new Date(movie.release_date);
		const unDiaEnMilsegundos = 24 * 60 * 60 * 1000;
		const diasParaElEstreno = Math.ceil((releaseDate.getTime() - today.getTime()) / unDiaEnMilsegundos);

		const remainingShowtimes = await this._showtimesRepo.getAll(
			{ count: true },
			{ movie: movieId, deleted_at: null },
		);
		const totalFunctions = Array.isArray(remainingShowtimes)
			? remainingShowtimes.length
			: (remainingShowtimes.count ?? remainingShowtimes.rows?.length ?? 0);

		const stateIds = await this._getLifecycleStateIds();
		const COMING_SOON = stateIds['Próximamente'] || 1;
		const PREMIERE = stateIds['En Cartelera (Estreno)'] || 2;
		const REGULAR = stateIds['En Cartelera (Regular)'] || 3;
		const LAST_DAYS = stateIds['Últimos Días'] || 4;
		const OFF = stateIds['Fuera de Cartelera'] || 5;

		let targetLifecycle = movie.lifecycle_state;
		if (movie.lifecycle_state === LAST_DAYS) return;

		if (diasParaElEstreno > 7) {
			targetLifecycle = COMING_SOON;
		} else if (diasParaElEstreno <= 7 && diasParaElEstreno > 0) {
			targetLifecycle = PREMIERE;
		} else {
			if (totalFunctions === 0) {
				targetLifecycle = OFF;
			} else {
				targetLifecycle = REGULAR;
			}
		}

		if (movie.lifecycle_state !== targetLifecycle) {
			await this._movies.update(movieId, { lifecycle_state: targetLifecycle }, { transaction });
		}
	}

	// -------------------------------------------------------------------------
	//  CICLO DE VIDA - EVENTOS ESPECIALES
	// -------------------------------------------------------------------------
	private async _syncEventLifecycle(eventId: number, transaction?: Transaction) {
		const event = await this._specialEvents.getById(eventId, {
			attributes: ['id', 'release_date', 'lifecycle_state'],
			transaction,
		});
		if (!event) return;

		const now = new Date();
		const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
		const releaseDate = new Date(event.release_date);
		const unDiaEnMilsegundos = 24 * 60 * 60 * 1000;
		const diasParaElEstreno = Math.ceil((releaseDate.getTime() - today.getTime()) / unDiaEnMilsegundos);

		const remainingShowtimes = await this._showtimesRepo.getAll(
			{ count: true },
			{ special_event_id: eventId, deleted_at: null },
		);
		const totalFunctions = Array.isArray(remainingShowtimes)
			? remainingShowtimes.length
			: (remainingShowtimes.count ?? remainingShowtimes.rows?.length ?? 0);

		const stateIds = await this._getLifecycleStateIds();
		const COMING_SOON = stateIds['Próximamente'] || 1;
		const PREMIERE = stateIds['En Cartelera (Estreno)'] || 2;
		const REGULAR = stateIds['En Cartelera (Regular)'] || 3;
		const LAST_DAYS = stateIds['Últimos Días'] || 4;
		const OFF = stateIds['Fuera de Cartelera'] || 5;

		if (event.lifecycle_state === LAST_DAYS) return;

		let targetLifecycle = event.lifecycle_state;
		if (diasParaElEstreno > 7) {
			targetLifecycle = COMING_SOON;
		} else if (diasParaElEstreno <= 7 && diasParaElEstreno > 0) {
			targetLifecycle = PREMIERE;
		} else {
			targetLifecycle = totalFunctions === 0 ? OFF : REGULAR;
		}

		if (event.lifecycle_state !== targetLifecycle) {
			await this._specialEvents.update(eventId, { lifecycle_state: targetLifecycle }, { transaction });
		}
	}

	// -------------------------------------------------------------------------
	//  CARTELERA PÚBLICA - PELÍCULAS
	// -------------------------------------------------------------------------
	async getBillboard(filters?: any) {
		const now = new Date();
		const visibleStates = await this._getVisibleLifecycleStates();

		const bookingWhere: any = {
			end_time: { [Ops.gt]: now },
			deleted_at: null,
		};

		let targetCinemaId: number | undefined;
		if (typeof filters === 'number') {
			targetCinemaId = filters;
		} else if (filters && typeof filters === 'object') {
			targetCinemaId = filters.cinemaId ? Number(filters.cinemaId) : undefined;
		}

		const bookingQueryOptions: any = {
			count: false,
			attributes: ['id', 'room', 'start_time', 'end_time'],
			relations: [
				{
					association: '_Rooms',
					attributes: ['id', 'name', 'cinema'],
					required: targetCinemaId ? true : false,
					relations: [
						{
							association: '_Cinemas',
							attributes: ['id', 'name'],
							required: true,
							where: targetCinemaId ? { id: targetCinemaId } : {},
						},
					],
				},
			],
		};

		const allBookings = await this._roomBookings.getAll(bookingQueryOptions, bookingWhere);
		let bookingList = Array.isArray(allBookings) ? allBookings : allBookings.rows || [];

		if (!bookingList.length) {
			if (targetCinemaId) {
				const cinemasRepo = Database.repository('main', 'cinemas');
				const cinema = await cinemasRepo.getById(targetCinemaId);
				const cinemaName = cinema?.name ?? `sucursal ${targetCinemaId}`;
				throw new NotFoundError(
					`No hay funciones disponibles en la sucursal ${cinemaName}`,
					'NO_SHOWTIMES_IN_CINEMA',
				);
			}
			return { count: 0, rows: [] };
		}

		if (targetCinemaId) {
			bookingList = bookingList.filter((b: any) => {
				const cinemaIdInRoom = b._Rooms?.cinema ?? b._Rooms?.cinemaId;
				return Number(cinemaIdInRoom) === targetCinemaId;
			});
		}

		if (!bookingList.length) {
			throw new NotFoundError('No se encontraron funciones programadas para la sucursal seleccionada');
		}

		const bookingIds = bookingList.map((b: any) => b.id);
		const showtimeWhere: any = { booking: bookingIds, deleted_at: null };

		const showtimes = await this._showtimesRepo.getAll({ count: false }, showtimeWhere);
		let showtimeList = Array.isArray(showtimes) ? showtimes : showtimes.rows || [];

		if (!showtimeList.length) {
			if (targetCinemaId) {
				throw new NotFoundError('No se encontraron funciones programadas para la sucursal seleccionada');
			}
			return { count: 0, rows: [] };
		}

		if (filters && typeof filters === 'object') {
			if (filters.movieId) {
				showtimeList = showtimeList.filter((s: any) => s.movie === Number(filters.movieId));
			}
			if (filters.projectionType) {
				const pt = String(filters.projectionType).toLowerCase();
				showtimeList = showtimeList.filter((s: any) => {
					const desc = (s._ProjectionType?.description || '').toLowerCase();
					const idStr = String(s.projection_type);
					return desc.includes(pt) || idStr === pt;
				});
			}
			if (filters.language) {
				const lang = String(filters.language).toLowerCase();
				showtimeList = showtimeList.filter((s: any) => {
					const desc = (s._Language?.description || '').toLowerCase();
					const idStr = String(s.language);
					return desc.includes(lang) || idStr === lang;
				});
			}
		}

		if (!showtimeList.length) {
			throw new NotFoundError(
				'No se encontraron funciones que coincidan con los filtros seleccionados para esta sucursal',
			);
		}

		const rawMovieIds = [...new Set(showtimeList.map((s: any) => s.movie))];
		const movies = await this._movies.getAll(
			{
				count: false,
				attributes: ['id', 'title', 'duration_minutes', 'poster_url', 'lifecycle_state'],
				relations: [
					{ association: '_LifecycleStates', attributes: ['id', 'description'], required: false },
					{ association: '_AgeClassifications', attributes: ['id', 'description'], required: false },
					{ association: '_Genres', attributes: ['id', 'description'], required: false },
				],
			},
			{ id: rawMovieIds, lifecycle_state: visibleStates, deleted_at: null },
		);
		const movieList: any[] = Array.isArray(movies) ? movies : movies.rows || [];
		const movieMap = new Map<number, any>(movieList.map((m: any) => [m.id, m]));

		const projTypeIds = [...new Set(showtimeList.map((s: any) => s.projection_type))];
		const languageIds = [...new Set(showtimeList.map((s: any) => s.language))];
		const currencyIds = [...new Set(showtimeList.map((s: any) => s.currency))];

		const [projTypes, languages, currencies] = await Promise.all([
			(Database.repository('main', 'projection-types') as any).getAll(
				{ count: false, attributes: ['id', 'description'] },
				{ id: projTypeIds },
			),
			(Database.repository('main', 'languages') as any).getAll(
				{ count: false, attributes: ['id', 'description'] },
				{ id: languageIds },
			),
			(Database.repository('main', 'currencies') as any).getAll(
				{ count: false, attributes: ['id', 'code', 'symbol'] },
				{ id: currencyIds },
			),
		]);

		const projMap = new Map<number, any>(
			(Array.isArray(projTypes) ? projTypes : projTypes.rows).map((p: any) => [p.id, p]),
		);
		const langMap = new Map<number, any>(
			(Array.isArray(languages) ? languages : languages.rows).map((l: any) => [l.id, l]),
		);
		const currMap = new Map<number, any>(
			(Array.isArray(currencies) ? currencies : currencies.rows).map((c: any) => [c.id, c]),
		);
		const bookingMap = new Map<number, any>(bookingList.map((b: any) => [b.id, b]));

		const billboardMap = new Map<number, any>();
		for (const s of showtimeList) {
			const movie = movieMap.get(s.movie);
			if (!movie) continue;
			const booking = bookingMap.get(s.booking);
			if (!booking) continue;

			if (!billboardMap.has(movie.id)) {
				billboardMap.set(movie.id, {
					movie: {
						id: movie.id,
						title: movie.title,
						duration_minutes: movie.duration_minutes,
						poster_url: movie.poster_url ?? null,
						lifecycle: movie._LifecycleStates
							? { id: movie._LifecycleStates.id, description: movie._LifecycleStates.description }
							: null,
						age_classification: movie._AgeClassifications
							? { id: movie._AgeClassifications.id, description: movie._AgeClassifications.description }
							: null,
						genres: movie._Genres
							? movie._Genres.map((g: any) => ({ id: g.id, description: g.description }))
							: [],
					},
					showtimes: [],
				});
			}

			const proj = projMap.get(s.projection_type) ?? {};
			const lang = langMap.get(s.language) ?? {};
			const curr = currMap.get(s.currency) ?? {};
			const room = booking._Rooms ?? {};
			const cinema = room._Cinemas ?? null;

			billboardMap.get(movie.id).showtimes.push({
				id: s.id,
				booking: {
					id: booking.id,
					start_time: booking.start_time,
					end_time: booking.end_time,
					room: {
						id: room.id,
						name: room.name,
						cinema: cinema ? { id: cinema.id, name: cinema.name } : null,
					},
				},
				projection_type: { id: proj.id, description: proj.description },
				language: { id: lang.id, description: lang.description },
				currency: { id: curr.id, code: curr.code, symbol: curr.symbol },
				price: s.price,
				earned_loyalty_points: s.earned_loyalty_points,
			});
		}

		const rows = [...billboardMap.values()];
		return { count: rows.length, rows };
	}

	// -------------------------------------------------------------------------
	//  CARTELERA PÚBLICA - EVENTOS ESPECIALES
	// -------------------------------------------------------------------------
	async getEventsBillboard(cinemaId?: number) {
		const now = new Date();
		const visibleStates = await this._getVisibleLifecycleStates();

		const bookingWhere: any = { end_time: { [Ops.gt]: now }, deleted_at: null };

		const bookingQueryOptions: any = {
			count: false,
			attributes: ['id', 'room', 'start_time', 'end_time'],
			relations: [
				{
					association: '_Rooms',
					attributes: ['id', 'name', 'cinema'],
					required: cinemaId ? true : false,
					relations: [
						{
							association: '_Cinemas',
							attributes: ['id', 'name'],
							required: true,
							where: cinemaId ? { id: cinemaId } : {},
						},
					],
				},
			],
		};

		const allBookings = await this._roomBookings.getAll(bookingQueryOptions, bookingWhere);
		let bookingList = Array.isArray(allBookings) ? allBookings : allBookings.rows || [];

		if (cinemaId) {
			bookingList = bookingList.filter((b: any) => {
				const cinemaIdInRoom = b._Rooms?.cinema ?? b._Rooms?.cinemaId;
				return Number(cinemaIdInRoom) === cinemaId;
			});
		}

		if (!bookingList.length) return { count: 0, rows: [] };

		const bookingIds = bookingList.map((b: any) => b.id);
		const showtimeWhere: any = {
			booking: bookingIds,
			deleted_at: null,
			special_event_id: { [Ops.ne]: null },
		};

		const showtimes = await this._showtimesRepo.getAll({ count: false }, showtimeWhere);
		const showtimeList: any[] = Array.isArray(showtimes) ? showtimes : showtimes.rows || [];

		if (!showtimeList.length) return { count: 0, rows: [] };

		const rawEventIds = [...new Set(showtimeList.map((s: any) => s.special_event_id))];
		const events = await this._specialEvents.getAll(
			{
				count: false,
				attributes: ['id', 'title', 'duration_minutes', 'poster_url', 'lifecycle_state'],
				relations: [
					{ association: '_LifecycleStates', attributes: ['id', 'description'], required: false },
					{ association: '_AgeClassifications', attributes: ['id', 'description'], required: false },
				],
			},
			{ id: rawEventIds, lifecycle_state: visibleStates, deleted_at: null },
		);
		const eventList: any[] = Array.isArray(events) ? events : events.rows || [];
		const eventMap = new Map<number, any>(eventList.map((e: any) => [e.id, e]));

		const projTypeIds = [...new Set(showtimeList.map((s: any) => s.projection_type))];
		const languageIds = [...new Set(showtimeList.map((s: any) => s.language))];
		const currencyIds = [...new Set(showtimeList.map((s: any) => s.currency))];

		const [projTypes, languages, currencies] = await Promise.all([
			(Database.repository('main', 'projection-types') as any).getAll(
				{ count: false, attributes: ['id', 'description'] },
				{ id: projTypeIds },
			),
			(Database.repository('main', 'languages') as any).getAll(
				{ count: false, attributes: ['id', 'description'] },
				{ id: languageIds },
			),
			(Database.repository('main', 'currencies') as any).getAll(
				{ count: false, attributes: ['id', 'code', 'symbol'] },
				{ id: currencyIds },
			),
		]);

		const projMap = new Map<number, any>(
			(Array.isArray(projTypes) ? projTypes : projTypes.rows).map((p: any) => [p.id, p]),
		);
		const langMap = new Map<number, any>(
			(Array.isArray(languages) ? languages : languages.rows).map((l: any) => [l.id, l]),
		);
		const currMap = new Map<number, any>(
			(Array.isArray(currencies) ? currencies : currencies.rows).map((c: any) => [c.id, c]),
		);
		const bookingMap = new Map<number, any>(bookingList.map((b: any) => [b.id, b]));

		const billboardMap = new Map<number, any>();
		for (const s of showtimeList) {
			const event = eventMap.get(s.special_event_id);
			if (!event) continue;
			const booking = bookingMap.get(s.booking);
			if (!booking) continue;

			if (!billboardMap.has(event.id)) {
				billboardMap.set(event.id, {
					event: {
						id: event.id,
						title: event.title,
						duration_minutes: event.duration_minutes,
						poster_url: event.poster_url ?? null,
						lifecycle: event._LifecycleStates
							? { id: event._LifecycleStates.id, description: event._LifecycleStates.description }
							: null,
						age_classification: event._AgeClassifications
							? { id: event._AgeClassifications.id, description: event._AgeClassifications.description }
							: null,
					},
					showtimes: [],
				});
			}

			const proj = projMap.get(s.projection_type) ?? {};
			const lang = langMap.get(s.language) ?? {};
			const curr = currMap.get(s.currency) ?? {};
			const room = booking._Rooms ?? {};
			const cinema = room._Cinemas ?? null;

			billboardMap.get(event.id).showtimes.push({
				id: s.id,
				booking: {
					id: booking.id,
					start_time: booking.start_time,
					end_time: booking.end_time,
					room: {
						id: room.id,
						name: room.name,
						cinema: cinema ? { id: cinema.id, name: cinema.name } : null,
					},
				},
				projection_type: { id: proj.id, description: proj.description },
				language: { id: lang.id, description: lang.description },
				currency: { id: curr.id, code: curr.code, symbol: curr.symbol },
				price: s.price,
				earned_loyalty_points: s.earned_loyalty_points,
			});
		}

		const rows = [...billboardMap.values()];
		return { count: rows.length, rows };
	}

	// -------------------------------------------------------------------------
	//  FUNCIONES DE UNA PELÍCULA EN UNA SUCURSAL
	// -------------------------------------------------------------------------
	async getMovieShowtimesByCinema(movieId: number, cinemaId: number, userId?: number) {
		const now = new Date();
		const visibleStates = await this._getVisibleLifecycleStates();

		const bookings = await this._roomBookings.getAll(
			{
				count: false,
				attributes: ['id', 'room', 'start_time', 'end_time'],
				relations: [
					{
						association: '_Rooms',
						attributes: ['id', 'name', 'cinema', 'grid_rows', 'grid_columns', 'room_type'],
						required: true,
						where: { cinema: cinemaId },
					},
				],
				order: [['start_time', 'ASC']],
			},
			{ end_time: { [Ops.gt]: now }, deleted_at: null },
		);

		const bookingList: any[] = Array.isArray(bookings) ? bookings : bookings.rows;
		if (!bookingList.length) {
			throw new NotFoundError(`No hay funciones disponibles para esta película en la sucursal seleccionada`);
		}

		const bookingIds = bookingList.map((b: any) => b.id);

		const showtimes = await this._showtimesRepo.getAll(
			{
				count: false,
				attributes: [
					'id',
					'booking',
					'movie',
					'projection_type',
					'language',
					'currency',
					'price',
					'earned_loyalty_points',
				],
			},
			{ booking: bookingIds, movie: movieId, deleted_at: null },
		);

		const showtimeList: any[] = Array.isArray(showtimes) ? showtimes : showtimes.rows;
		if (!showtimeList.length) {
			throw new NotFoundError(`No hay funciones disponibles para esta película en la sucursal seleccionada`);
		}

		const movie = await this._movies.getById(movieId, {
			attributes: ['id', 'title', 'duration_minutes', 'poster_url', 'lifecycle_state'],
		});
		if (!movie || !visibleStates.includes(movie.lifecycle_state)) {
			throw new NotFoundError('Película no encontrada o no está en cartelera');
		}

		const projTypeIds = [...new Set(showtimeList.map((s: any) => s.projection_type))];
		const languageIds = [...new Set(showtimeList.map((s: any) => s.language))];
		const currencyIds = [...new Set(showtimeList.map((s: any) => s.currency))];

		const [projTypes, languages, currencies] = await Promise.all([
			(Database.repository('main', 'projection-types') as any).getAll(
				{ count: false, attributes: ['id', 'description'] },
				{ id: projTypeIds },
			),
			(Database.repository('main', 'languages') as any).getAll(
				{ count: false, attributes: ['id', 'description'] },
				{ id: languageIds },
			),
			(Database.repository('main', 'currencies') as any).getAll(
				{ count: false, attributes: ['id', 'code', 'symbol'] },
				{ id: currencyIds },
			),
		]);

		const projMap = new Map<number, any>(
			(Array.isArray(projTypes) ? projTypes : projTypes.rows).map((p: any) => [p.id, p]),
		);
		const langMap = new Map<number, any>(
			(Array.isArray(languages) ? languages : languages.rows).map((l: any) => [l.id, l]),
		);
		const currMap = new Map<number, any>(
			(Array.isArray(currencies) ? currencies : currencies.rows).map((c: any) => [c.id, c]),
		);
		const bookingMap = new Map<number, any>(bookingList.map((b: any) => [b.id, b]));

		let activeQuote = null;
		let cacheData: any = null;
		if (userId) {
			activeQuote = await shoppingSessionService.getActiveQuote(userId);
			if (activeQuote) {
				cacheData = await PricingCacheService.getActiveModifiers();
			}
		}

		const rows = await Promise.all(
			showtimeList.map(async (s: any) => {
				const booking = bookingMap.get(s.booking);
				const room = booking?._Rooms ?? {};
				const totalSeats = await this._seats.count({ room: room.id, deleted_at: null });
				const soldSeats = await this._tickets.count({ booking: s.booking, deleted_at: null });
				const proj = projMap.get(s.projection_type) ?? {};
				const lang = langMap.get(s.language) ?? {};
				const curr = currMap.get(s.currency) ?? {};

				const resultObj: any = {
					id: s.id,
					booking: {
						id: booking?.id,
						start_time: booking?.start_time,
						end_time: booking?.end_time,
						room: {
							id: room.id,
							name: room.name,
							total_seats: totalSeats,
							available_seats: Math.max(0, totalSeats - soldSeats),
						},
					},
					projection_type: { id: proj.id, description: proj.description },
					language: { id: lang.id, description: lang.description },
					currency: { id: curr.id, code: curr.code, symbol: curr.symbol },
					earned_loyalty_points: s.earned_loyalty_points,
				};

				if (activeQuote && cacheData) {
					const sessionDate = new Date(activeQuote.created_at || Date.now());
					const currentDate = sessionDate.toISOString().split('T')[0];
					const currentTime = sessionDate.toTimeString().split(' ')[0];
					const currentDay = sessionDate.getDay() === 0 ? 7 : sessionDate.getDay();
					const timeContext = { currentDate, currentTime, currentDay };

					const baseContext = {
						modifier_scope: 1,
						cinemaId: cinemaId,
						booking_type: booking?.booking_type || 1,
						movie: movieId,
						projection_type: s.projection_type,
						room_type: room.room_type || 1,
					};

					const basePricing = PricingService.calculateFinalPrice(
						s.price,
						baseContext,
						cacheData.modifiers,
						cacheData.opTypesMap,
						activeQuote.exchange_rates,
						timeContext,
					);

					const pricingMatrix: any[] = [];
					for (const seatCat of cacheData.seatCategories) {
						for (const audCat of cacheData.audienceCategories) {
							const specificContext = {
								...baseContext,
								seat_category: seatCat.id,
								audienceCategoryId: audCat.id,
							};
							const specificPricing = PricingService.calculateFinalPrice(
								basePricing.finalPrice,
								specificContext,
								cacheData.modifiers,
								cacheData.opTypesMap,
								activeQuote.exchange_rates,
								timeContext,
							);
							pricingMatrix.push({
								audience_category: { id: audCat.id, name: audCat.description },
								seat_category: { id: seatCat.id, name: seatCat.description },
								final_price: specificPricing.finalPrice,
								applied_modifiers: specificPricing.appliedModifiers,
							});
						}
					}
					resultObj.pricing = {
						base_price: basePricing.finalPrice,
						showtime_applied_modifiers: basePricing.appliedModifiers,
						pricing_matrix: pricingMatrix,
					};
				} else {
					delete resultObj.currency;
				}
				return resultObj;
			}),
		);

		return {
			movie: {
				id: movie.id,
				title: movie.title,
				duration_minutes: movie.duration_minutes,
				poster_url: movie.poster_url,
			},
			count: rows.length,
			rows,
		};
	}

	// -------------------------------------------------------------------------
	//  FUNCIONES DE UN EVENTO ESPECIAL EN UNA SUCURSAL
	// -------------------------------------------------------------------------
	async getEventShowtimesByCinema(eventId: number, cinemaId: number) {
		const now = new Date();
		const visibleStates = await this._getVisibleLifecycleStates();

		const bookings = await this._roomBookings.getAll(
			{
				count: false,
				attributes: ['id', 'room', 'start_time', 'end_time'],
				relations: [
					{
						association: '_Rooms',
						attributes: ['id', 'name', 'cinema', 'grid_rows', 'grid_columns'],
						required: true,
						where: { cinema: cinemaId },
					},
				],
				order: [['start_time', 'ASC']],
			},
			{ end_time: { [Ops.gt]: now }, deleted_at: null },
		);

		const bookingList: any[] = Array.isArray(bookings) ? bookings : bookings.rows;
		if (!bookingList.length) {
			throw new NotFoundError(`No hay funciones disponibles para este evento en la sucursal seleccionada`);
		}

		const bookingIds = bookingList.map((b: any) => b.id);
		const showtimes = await this._showtimesRepo.getAll(
			{
				count: false,
				attributes: [
					'id',
					'booking',
					'special_event_id',
					'projection_type',
					'language',
					'currency',
					'price',
					'earned_loyalty_points',
				],
			},
			{ booking: bookingIds, special_event_id: eventId, deleted_at: null },
		);

		const showtimeList: any[] = Array.isArray(showtimes) ? showtimes : showtimes.rows;
		if (!showtimeList.length) {
			throw new NotFoundError(`No hay funciones disponibles para este evento en la sucursal seleccionada`);
		}

		const event = await this._specialEvents.getById(eventId, {
			attributes: ['id', 'title', 'duration_minutes', 'poster_url', 'lifecycle_state'],
		});
		if (!event || !visibleStates.includes(event.lifecycle_state)) {
			throw new NotFoundError('Evento especial no encontrado o no está en cartelera');
		}

		const projTypeIds = [...new Set(showtimeList.map((s: any) => s.projection_type))];
		const languageIds = [...new Set(showtimeList.map((s: any) => s.language))];
		const currencyIds = [...new Set(showtimeList.map((s: any) => s.currency))];

		const [projTypes, languages, currencies] = await Promise.all([
			(Database.repository('main', 'projection-types') as any).getAll(
				{ count: false, attributes: ['id', 'description'] },
				{ id: projTypeIds },
			),
			(Database.repository('main', 'languages') as any).getAll(
				{ count: false, attributes: ['id', 'description'] },
				{ id: languageIds },
			),
			(Database.repository('main', 'currencies') as any).getAll(
				{ count: false, attributes: ['id', 'code', 'symbol'] },
				{ id: currencyIds },
			),
		]);

		const projMap = new Map<number, any>(
			(Array.isArray(projTypes) ? projTypes : projTypes.rows).map((p: any) => [p.id, p]),
		);
		const langMap = new Map<number, any>(
			(Array.isArray(languages) ? languages : languages.rows).map((l: any) => [l.id, l]),
		);
		const currMap = new Map<number, any>(
			(Array.isArray(currencies) ? currencies : currencies.rows).map((c: any) => [c.id, c]),
		);
		const bookingMap = new Map<number, any>(bookingList.map((b: any) => [b.id, b]));

		const rows = await Promise.all(
			showtimeList.map(async (s: any) => {
				const booking = bookingMap.get(s.booking);
				const room = booking?._Rooms ?? {};
				const totalSeats = await this._seats.count({ room: room.id, deleted_at: null });
				const soldSeats = await this._tickets.count({ booking: s.booking, deleted_at: null });
				const proj = projMap.get(s.projection_type) ?? {};
				const lang = langMap.get(s.language) ?? {};
				const curr = currMap.get(s.currency) ?? {};
				return {
					id: s.id,
					booking: {
						id: booking?.id,
						start_time: booking?.start_time,
						end_time: booking?.end_time,
						room: {
							id: room.id,
							name: room.name,
							total_seats: totalSeats,
							available_seats: Math.max(0, totalSeats - soldSeats),
						},
					},
					projection_type: { id: proj.id, description: proj.description },
					language: { id: lang.id, description: lang.description },
					currency: { id: curr.id, code: curr.code, symbol: curr.symbol },
					price: s.price,
					earned_loyalty_points: s.earned_loyalty_points,
				};
			}),
		);

		return {
			event: {
				id: event.id,
				title: event.title,
				duration_minutes: event.duration_minutes,
				poster_url: event.poster_url,
			},
			count: rows.length,
			rows,
		};
	}

	// -------------------------------------------------------------------------
	//  CREAR FUNCIÓN (unificado para películas y eventos)
	// -------------------------------------------------------------------------
	async createShowtime(data: any) {
		const showtimeType: 'movie' | 'event' = data.showtime_type ?? 'movie';

		if (showtimeType !== 'movie' && showtimeType !== 'event') {
			throw new ValidationError('El campo showtime_type debe ser "movie" o "event"', ['showtime_type']);
		}

		const roomId = data.room ?? data.roomId;
		const projTypeId = data.projection_type ?? data.projectionTypeId;
		const languageId = data.language ?? data.languageId;
		const startTime = data.start_time ?? data.startTime;
		const endTime = data.end_time ?? data.endTime;
		const currencyId = data.currency ?? data.currencyId;
		const price = Number(data.price);
		const earnedLoyaltyPoints = data.earned_loyalty_points ?? data.earnedLoyaltyPoints ?? null;

		if (!roomId) throw new ValidationError('La sala (room) es obligatoria');
		if (!projTypeId) throw new ValidationError('El tipo de proyección (projection_type) es obligatorio');
		if (!languageId) throw new ValidationError('El idioma (language) es obligatorio');
		if (!startTime) throw new ValidationError('La hora de inicio (start_time) es obligatoria');
		if (!endTime) throw new ValidationError('La hora de fin (end_time) es obligatoria');
		if (!currencyId) throw new ValidationError('La moneda (currency) es obligatoria');
		if (isNaN(price) || price <= 0) throw new ValidationError('El precio debe ser un número positivo');

		const start = new Date(startTime);
		const end = new Date(endTime);
		if (isNaN(start.getTime())) throw new ValidationError('start_time no es una fecha válida');
		if (isNaN(end.getTime())) throw new ValidationError('end_time no es una fecha válida');
		if (end <= start) throw new ValidationError('La hora de fin debe ser posterior a la de inicio');

		if (showtimeType === 'movie') {
			return this._createMovieShowtime({
				roomId,
				projTypeId,
				languageId,
				start,
				end,
				currencyId,
				price,
				earnedLoyaltyPoints,
				data,
			});
		} else {
			return this._createEventShowtime({
				roomId,
				projTypeId,
				languageId,
				start,
				end,
				currencyId,
				price,
				earnedLoyaltyPoints,
				data,
			});
		}
	}

	private async _createMovieShowtime(params: any) {
		const { roomId, projTypeId, languageId, start, end, currencyId, price, earnedLoyaltyPoints, data } = params;
		const movieId = data.movie ?? data.movieId;
		if (!movieId)
			throw new ValidationError('El campo movie es obligatorio para funciones de tipo "movie"', ['movie']);

		const [movie, room, language, currency] = await Promise.all([
			this._movies.getById(movieId, {
				attributes: ['id', 'title', 'duration_minutes', 'release_date', 'lifecycle_state'],
			}),
			this._rooms.getById(roomId, { attributes: ['id', 'name'] }),
			(Database.repository('main', 'languages') as any).getById(languageId, {
				attributes: ['id', 'description'],
			}),
			(Database.repository('main', 'currencies') as any).getById(currencyId, {
				attributes: ['id', 'code', 'symbol'],
			}),
		]);

		if (!movie) throw new ValidationError(`No existe ninguna película con id ${movieId}`);
		if (!room) throw new ValidationError(`No existe ninguna sala con id ${roomId}`);
		if (!language) throw new ValidationError(`No existe ningún idioma con id ${languageId}`);
		if (!currency) throw new ValidationError(`No existe ninguna moneda con id ${currencyId}`);

		const releaseDate = new Date(movie.release_date);
		const releaseDateStart = new Date(
			Date.UTC(releaseDate.getUTCFullYear(), releaseDate.getUTCMonth(), releaseDate.getUTCDate(), 0, 0, 0),
		);
		if (start < releaseDateStart) {
			throw new ValidationError(
				`No se pueden programar funciones antes de la fecha de estreno de la película (${movie.release_date}).`,
				['start_time'],
			);
		}

		const roomProjectionType = await (Database.repository('main', 'room-projection-types') as any).getOne({
			room: roomId,
			projection_type: projTypeId,
		});
		if (!roomProjectionType) {
			const projType = await (Database.repository('main', 'projection-types') as any).getById(projTypeId, {
				attributes: ['id', 'description'],
			});
			const projDesc = projType?.description ?? `id ${projTypeId}`;
			throw new ValidationError(
				`La sala "${room.name}" no admite el tipo de proyección "${projDesc}". Verificá los tipos habilitados para esta sala.`,
			);
		}

		const result = await this._roomBookings.transaction(async (transaction: Transaction) => {
			await this._checkOverlap(Number(roomId), start, end, undefined, transaction);

			let bookingType = await this._bookingTypes.getOne({ description: 'Película' }, { transaction });
			if (!bookingType) bookingType = await this._bookingTypes.getById(BOOKING_TYPE_ID_SHOWTIME, { transaction });
			if (!bookingType) throw new ValidationError('Falta el tipo de reserva "Película" en booking_types');

			const booking = await this._roomBookings.create(
				{ room: Number(roomId), start_time: start, end_time: end, booking_type: bookingType.id },
				{ transaction },
			);

			const showtime = await this._showtimesRepo.create(
				{
					booking: booking.id,
					movie: movieId,
					projection_type: projTypeId,
					language: languageId,
					currency: currencyId,
					price,
					earned_loyalty_points: earnedLoyaltyPoints,
				},
				{ transaction },
			);

			await this._syncMovieLifecycle(movieId, transaction);

			try {
				const subscriptions = await this._movieSubscriptions.getAll(
					{ count: false },
					{ movie: movieId, is_notified: false },
				);
				const subList = Array.isArray(subscriptions) ? subscriptions : subscriptions.rows || [];
				for (const sub of subList) {
					await this._movieSubscriptions.update(sub.id, { is_notified: true }, { transaction });
				}
			} catch {
				// No interrumpir
			}

			const projType = await (Database.repository('main', 'projection-types') as any).getById(projTypeId, {
				attributes: ['id', 'description'],
				transaction,
			});

			return {
				id: showtime.id,
				room_booking_id: booking.id,
				start_time: booking.start_time,
				end_time: booking.end_time,
				room: { id: room.id, name: room.name },
				movie: { id: movie.id, title: movie.title, duration_minutes: movie.duration_minutes },
				projection_type: { id: projType?.id ?? projTypeId, description: projType?.description ?? 'N/A' },
				language: { id: language.id, description: language.description },
				currency: { id: currency.id, code: currency.code, symbol: currency.symbol ?? '$' },
				price: showtime.price,
				earned_loyalty_points: showtime.earned_loyalty_points,
			};
		});

		return result;
	}

	private async _createEventShowtime(params: any) {
		const { roomId, projTypeId, languageId, start, end, currencyId, price, earnedLoyaltyPoints, data } = params;
		const eventId = data.special_event_id ?? data.eventId;
		if (!eventId)
			throw new ValidationError('El campo special_event_id es obligatorio para funciones de tipo "event"', [
				'special_event_id',
			]);

		const [event, room, language, currency, projType] = await Promise.all([
			this._specialEvents.getById(eventId, {
				attributes: ['id', 'title', 'duration_minutes', 'release_date', 'lifecycle_state'],
			}),
			this._rooms.getById(roomId, { attributes: ['id', 'name'] }),
			(Database.repository('main', 'languages') as any).getById(languageId, {
				attributes: ['id', 'description'],
			}),
			(Database.repository('main', 'currencies') as any).getById(currencyId, {
				attributes: ['id', 'code', 'symbol'],
			}),
			(Database.repository('main', 'projection-types') as any).getById(projTypeId, {
				attributes: ['id', 'description'],
			}),
		]);

		if (!event) throw new ValidationError(`No existe ningún evento especial con id ${eventId}`);
		if (!room) throw new ValidationError(`No existe ninguna sala con id ${roomId}`);
		if (!language) throw new ValidationError(`No existe ningún idioma con id ${languageId}`);
		if (!currency) throw new ValidationError(`No existe ninguna moneda con id ${currencyId}`);
		if (!projType) throw new ValidationError(`No existe ningún tipo de proyección con id ${projTypeId}`);

		return this._roomBookings.transaction(async (transaction: Transaction) => {
			await this._checkOverlap(Number(roomId), start, end, undefined, transaction);

			let bookingType = await this._bookingTypes.getOne({ description: 'Evento Alternativo' }, { transaction });
			if (!bookingType)
				bookingType = await this._bookingTypes.getById(BOOKING_TYPE_ID_SPECIAL_EVENT, { transaction });
			if (!bookingType)
				throw new ValidationError('Falta el tipo de reserva "Evento Alternativo" en booking_types');

			const booking = await this._roomBookings.create(
				{ room: Number(roomId), start_time: start, end_time: end, booking_type: bookingType.id },
				{ transaction },
			);

			const showtime = await this._showtimesRepo.create(
				{
					booking: booking.id,
					movie: null,
					special_event_id: eventId,
					projection_type: projTypeId,
					language: languageId,
					currency: currencyId,
					price,
					earned_loyalty_points: earnedLoyaltyPoints,
				},
				{ transaction },
			);

			await this._syncEventLifecycle(eventId, transaction);

			return {
				id: showtime.id,
				room_booking_id: booking.id,
				start_time: booking.start_time,
				end_time: booking.end_time,
				room: { id: room.id, name: room.name },
				event: { id: event.id, title: event.title, duration_minutes: event.duration_minutes },
				projection_type: { id: projType.id, description: projType.description },
				language: { id: language.id, description: language.description },
				currency: { id: currency.id, code: currency.code, symbol: currency.symbol ?? '$' },
				price: showtime.price,
				earned_loyalty_points: showtime.earned_loyalty_points,
			};
		});
	}

	// -------------------------------------------------------------------------
	//  GESTIÓN DE FUNCIONES (ADMIN)
	// -------------------------------------------------------------------------
	async getSeatsStatus(showtimeId: number) {
		const showtime = await this._showtimesRepo.getById(showtimeId, { attributes: ['booking'] });
		if (!showtime) throw new NotFoundError('Función no encontrada');

		const tickets = await this._tickets.getAll(
			{
				count: false,
				attributes: ['seat'],
				relations: [
					{
						association: '_Orders',
						required: true,
						where: { order_status: 2 },
					},
				],
			},
			{ booking: showtime.booking, deleted_at: null },
		);

		const soldSeats = (Array.isArray(tickets) ? tickets : tickets.rows || []).map((t: any) => t.seat);

		const redis = CacheDatabaseProvider.getInstance().client;
		const zsetKey = `showtime:${showtimeId}:locked_seats`;
		const nowMs = Date.now();

		await redis.zremrangebyscore(zsetKey, 0, nowMs);
		const lockedRaw = await redis.zrange(zsetKey, 0, -1);
		const lockedSeats = lockedRaw.map(Number);

		return { sold: soldSeats, locked: lockedSeats };
	}

	async findAllShowtimes(filters?: any) {
		const { date, startDate, endDate, cinemaId, movieId, eventId, onlyFuture = true, ...rest } = filters ?? {};
		const now = new Date();

		const bookingWhere: any = { deleted_at: null };
		if (onlyFuture) {
			bookingWhere.end_time = { [Ops.gt]: now };
		}

		if (startDate && endDate) {
			const start = new Date(startDate);
			const end = new Date(endDate);
			if (isNaN(start.getTime()) || isNaN(end.getTime())) {
				throw new ValidationError('startDate y endDate deben ser fechas válidas (YYYY-MM-DD)');
			}
			start.setUTCHours(0, 0, 0, 0);
			end.setUTCHours(23, 59, 59, 999);
			bookingWhere.start_time = { [Ops.between]: [start, end] };
		} else if (date) {
			const dayStart = new Date(`${date}T00:00:00.000Z`);
			const dayEnd = new Date(`${date}T23:59:59.999Z`);
			if (isNaN(dayStart.getTime())) {
				throw new ValidationError('La fecha proporcionada no es válida (YYYY-MM-DD)');
			}
			bookingWhere.start_time = { [Ops.between]: [dayStart, dayEnd] };
		}

		let targetBookingIds: number[] = [];
		if (cinemaId || date || startDate || onlyFuture) {
			const bookingQueryOptions: any = {
				count: false,
				attributes: ['id', 'room', 'start_time', 'end_time'],
				relations: [{ association: '_Rooms', attributes: ['id', 'name', 'cinema'], required: true }],
			};
			const allBookings = await this._roomBookings.getAll(bookingQueryOptions, bookingWhere);
			let bookingList = Array.isArray(allBookings) ? allBookings : allBookings.rows || [];

			if (cinemaId) {
				bookingList = bookingList.filter((b: any) => b._Rooms?.cinema === Number(cinemaId));
			}

			targetBookingIds = bookingList.map((b: any) => b.id);

			if (targetBookingIds.length === 0) {
				if (date) {
					throw new NotFoundError(`No hay funciones disponibles para el día ${date}`);
				}
				throw new NotFoundError('No se encontraron funciones disponibles para los criterios seleccionados');
			}
		}

		const showtimeWhere: any = { deleted_at: null };
		if (targetBookingIds.length > 0) showtimeWhere.booking = targetBookingIds;
		if (movieId) showtimeWhere.movie = movieId;
		if (eventId) showtimeWhere.special_event_id = eventId;

		const rawResult = await this._showtimesRepo.getAll(
			{
				...rest,
				count: true,
				attributes: [
					'id',
					'booking',
					'movie',
					'special_event_id',
					'projection_type',
					'language',
					'currency',
					'price',
					'earned_loyalty_points',
				],
			},
			showtimeWhere,
		);

		const showtimesList = Array.isArray(rawResult) ? rawResult : rawResult.rows || [];
		const total = Array.isArray(rawResult) ? showtimesList.length : rawResult.count || 0;

		if (!showtimesList.length) {
			if (date) {
				throw new NotFoundError(`No hay funciones disponibles para el día ${date}`);
			}
			throw new NotFoundError('No se encontraron funciones disponibles para los criterios seleccionados');
		}

		const bookingIds = [...new Set(showtimesList.map((s: any) => s.booking))];
		const movieIds = [...new Set(showtimesList.map((s: any) => s.movie).filter(Boolean))];
		const eventIds = [...new Set(showtimesList.map((s: any) => s.special_event_id).filter(Boolean))];
		const projTypeIds = [...new Set(showtimesList.map((s: any) => s.projection_type))];
		const languageIds = [...new Set(showtimesList.map((s: any) => s.language))];
		const currencyIds = [...new Set(showtimesList.map((s: any) => s.currency))];

		const [bookings, movies, events, projTypes, languages, currencies] = await Promise.all([
			bookingIds.length
				? this._roomBookings.getAll(
						{
							count: false,
							attributes: ['id', 'room', 'start_time', 'end_time'],
							relations: [{ association: '_Rooms', attributes: ['id', 'name'] }],
						},
						{ id: bookingIds },
					)
				: [],
			movieIds.length
				? (Database.repository('main', 'movies') as any).getAll(
						{ count: false, attributes: ['id', 'title', 'duration_minutes'] },
						{ id: movieIds },
					)
				: [],
			eventIds.length
				? (Database.repository('main', 'special-events') as any).getAll(
						{ count: false, attributes: ['id', 'title', 'duration_minutes'] },
						{ id: eventIds },
					)
				: [],
			projTypeIds.length
				? (Database.repository('main', 'projection-types') as any).getAll(
						{ count: false, attributes: ['id', 'description'] },
						{ id: projTypeIds },
					)
				: [],
			languageIds.length
				? (Database.repository('main', 'languages') as any).getAll(
						{ count: false, attributes: ['id', 'description'] },
						{ id: languageIds },
					)
				: [],
			currencyIds.length
				? (Database.repository('main', 'currencies') as any).getAll(
						{ count: false, attributes: ['id', 'code', 'symbol'] },
						{ id: currencyIds },
					)
				: [],
		]);

		const bookingMap = new Map<number, any>(
			(Array.isArray(bookings) ? bookings : bookings.rows || []).map((b: any) => [
				b.id,
				{ ...b, _roomName: b._Rooms?.name ?? null },
			]),
		);
		const movieMap = new Map<number, any>(
			(Array.isArray(movies) ? movies : movies.rows || []).map((m: any) => [m.id, m]),
		);
		const eventMap = new Map<number, any>(
			(Array.isArray(events) ? events : events.rows || []).map((e: any) => [e.id, e]),
		);
		const projMap = new Map<number, any>(
			(Array.isArray(projTypes) ? projTypes : projTypes.rows || []).map((p: any) => [p.id, p]),
		);
		const langMap = new Map<number, any>(
			(Array.isArray(languages) ? languages : languages.rows || []).map((l: any) => [l.id, l]),
		);
		const currencyMap = new Map<number, any>(
			(Array.isArray(currencies) ? currencies : currencies.rows || []).map((c: any) => [c.id, c]),
		);

		const rows = showtimesList.map((s: any) => {
			const booking = bookingMap.get(s.booking) ?? {};
			const projection = projMap.get(s.projection_type) ?? {};
			const language = langMap.get(s.language) ?? {};
			const currency = currencyMap.get(s.currency) ?? {};
			const isEvent = s.special_event_id !== null && s.special_event_id !== undefined;

			const base: any = {
				id: s.id,
				showtime_type: isEvent ? 'event' : 'movie',
				room_booking_id: booking.id,
				start_time: booking.start_time,
				end_time: booking.end_time,
				room: { id: booking.room, name: booking._roomName ?? null },
				projection_type: { id: projection.id, description: projection.description },
				language: { id: language.id, description: language.description },
				currency: { id: currency.id, code: currency.code, symbol: currency.symbol },
				price: s.price,
				earned_loyalty_points: s.earned_loyalty_points,
			};

			if (isEvent) {
				const event = eventMap.get(s.special_event_id) ?? {};
				base.event = { id: event.id, title: event.title, duration_minutes: event.duration_minutes };
			} else {
				const movie = movieMap.get(s.movie) ?? {};
				base.movie = { id: movie.id, title: movie.title, duration_minutes: movie.duration_minutes };
			}

			return base;
		});

		return { count: total, rows };
	}

	async findShowtimeById(id: number) {
		if (!id || isNaN(Number(id))) {
			throw new ValidationError('El ID de la función proporcionado no es válido.');
		}

		const raw = await this._showtimesRepo.getById(Number(id));
		if (!raw) throw new NotFoundError('Función no encontrada');

		const isEvent = raw.special_event_id !== null && raw.special_event_id !== undefined;

		const [booking, projType, language, currency] = await Promise.all([
			this._roomBookings.getById(raw.booking, { attributes: ['id', 'room', 'start_time', 'end_time'] }),
			(Database.repository('main', 'projection-types') as any).getById(raw.projection_type, {
				attributes: ['id', 'description'],
			}),
			(Database.repository('main', 'languages') as any).getById(raw.language, {
				attributes: ['id', 'description'],
			}),
			(Database.repository('main', 'currencies') as any).getById(raw.currency, {
				attributes: ['id', 'code', 'symbol'],
			}),
		]);

		const base: any = {
			id: raw.id,
			showtime_type: isEvent ? 'event' : 'movie',
			booking: {
				id: booking?.id,
				room: booking?.room,
				start_time: booking?.start_time,
				end_time: booking?.end_time,
			},
			projection_type: { id: projType?.id, description: projType?.description },
			language: { id: language?.id, description: language?.description },
			currency: { id: currency?.id, code: currency?.code, symbol: currency?.symbol },
			price: raw.price,
			earned_loyalty_points: raw.earned_loyalty_points,
		};

		if (isEvent) {
			const event = await this._specialEvents.getById(raw.special_event_id, {
				attributes: ['id', 'title', 'duration_minutes'],
			});
			base.event = { id: event?.id, title: event?.title, duration_minutes: event?.duration_minutes };
		} else {
			const movie = await this._movies.getById(raw.movie, {
				attributes: ['id', 'title', 'duration_minutes'],
			});
			base.movie = { id: movie?.id, title: movie?.title, duration_minutes: movie?.duration_minutes };
		}

		return base;
	}

	async updateShowtime(id: number, body: any) {
		const showtime = await this._showtimesRepo.getOne(
			{ id },
			{
				attributes: [
					'id',
					'booking',
					'movie',
					'special_event_id',
					'projection_type',
					'language',
					'currency',
					'price',
					'earned_loyalty_points',
				],
			},
		);
		if (!showtime) throw new NotFoundError('Función no encontrada');

		const isEvent = showtime.special_event_id !== null && showtime.special_event_id !== undefined;

		const updateData: Record<string, any> = {};
		if (body.price !== undefined) updateData.price = Number(body.price);
		if (body.earned_loyalty_points !== undefined) updateData.earned_loyalty_points = body.earned_loyalty_points;
		if (body.projection_type !== undefined) updateData.projection_type = body.projection_type;
		if (body.language !== undefined) updateData.language = body.language;
		if (body.currency !== undefined) updateData.currency = body.currency;

		const hasBookingChanges = body.room || body.start_time || body.end_time;
		if (!hasBookingChanges && Object.keys(updateData).length === 0)
			throw new ValidationError('No se proporcionaron datos para actualizar');

		if (hasBookingChanges) {
			const booking = await this._roomBookings.getById(showtime.booking);
			if (!booking) throw new NotFoundError('Reserva de sala no encontrada');

			const newRoom = body.room ?? booking.room;
			const newStart = body.start_time ? new Date(body.start_time) : booking.start_time;
			const newEnd = body.end_time ? new Date(body.end_time) : booking.end_time;

			if (newEnd <= newStart) throw new ValidationError('La hora de fin debe ser posterior a la de inicio');

			await this._roomBookings.transaction(async (transaction: Transaction) => {
				await this._checkOverlap(newRoom, newStart, newEnd, booking.id, transaction);
				await this._roomBookings.update(
					booking.id,
					{ room: newRoom, start_time: newStart, end_time: newEnd },
					{ transaction },
				);
				if (Object.keys(updateData).length > 0) {
					await this._showtimesRepo.update(id, updateData, { transaction });
				}

				if (isEvent) {
					await this._syncEventLifecycle(showtime.special_event_id, transaction);
				} else {
					await this._syncMovieLifecycle(showtime.movie, transaction);
				}
			});
			return null;
		}

		await this._showtimesRepo.update(id, updateData);
		return null;
	}

	async deleteShowtime(id: number) {
		const showtime = await this._showtimesRepo.getOne(
			{ id },
			{ attributes: ['id', 'booking', 'movie', 'special_event_id'] },
		);
		if (!showtime) throw new NotFoundError('Función no encontrada');

		const isEvent = showtime.special_event_id !== null && showtime.special_event_id !== undefined;

		const ticketCount = await this._tickets.count({ booking: showtime.booking, deleted_at: null });
		if (ticketCount > 0)
			throw new ConflictError(
				'No se puede cancelar la función porque tiene boletos vendidos',
				'SHOWTIME_HAS_TICKETS',
			);

		await this._roomBookings.transaction(async (transaction: Transaction) => {
			const booking = await this._roomBookings.getById(showtime.booking, { transaction });
			await this._showtimesRepo.delete(id, { transaction });
			if (booking) await this._roomBookings.delete(booking.id, { transaction });

			if (isEvent) {
				await this._syncEventLifecycle(showtime.special_event_id, transaction);
			} else {
				await this._syncMovieLifecycle(showtime.movie, transaction);
			}
		});

		return null;
	}

	async getSeatMap(showtimeId: number, userId?: number) {
		const showtime = await this._showtimesRepo.getOne(
			{ id: showtimeId },
			{
				attributes: [
					'id',
					'booking',
					'movie',
					'special_event_id',
					'projection_type',
					'language',
					'currency',
					'price',
				],
			},
		);
		if (!showtime) throw new NotFoundError('Función no encontrada');

		const booking = await this._roomBookings.getById(showtime.booking, {
			attributes: ['id', 'room', 'start_time', 'end_time', 'booking_type'],
		});
		if (!booking) throw new NotFoundError('Reserva de sala no encontrada');

		const allSeats = await this._seats.getAll(
			{
				count: false,
				attributes: ['id', 'row_identifier', 'column_number', 'seat_category', 'seat_condition'],
				order: [
					['row_identifier', 'ASC'],
					['column_number', 'ASC'],
				],
			},
			{ room: booking.room },
		);

		if (!allSeats || allSeats.length === 0) {
			return {
				showtime_id: showtimeId,
				booking_id: booking.id,
				room_id: booking.room,
				start_time: booking.start_time,
				end_time: booking.end_time,
				seats: [],
				summary: { total: 0, available: 0, locked: 0, sold: 0, maintenance: 0 },
			};
		}

		const soldTickets = await this._tickets.getAll(
			{ count: false, attributes: ['seat'] },
			{ booking: showtime.booking, deleted_at: null },
		);
		const soldSeatIds = new Set<number>(
			(Array.isArray(soldTickets) ? soldTickets : soldTickets).map((t: any) => t.seat),
		);

		const lockedSeatIds = new Set<number>();
		try {
			const redis = CacheDatabaseProvider.getInstance().client;
			const lockPattern = `lock:booking:${booking.id}:seat:*`;
			const lockKeys = await redis.keys(lockPattern);
			for (const key of lockKeys) {
				const parts = key.split(':');
				const seatId = Number(parts[parts.length - 1]);
				if (!isNaN(seatId)) lockedSeatIds.add(seatId);
			}
		} catch {
			// Ignorar
		}

		const categoryIds = [...new Set(allSeats.map((s: any) => s.seat_category))];
		const categoriesRaw = await (Database.repository('main', 'seat-categories') as any).getAll(
			{ count: false, attributes: ['id', 'description'] },
			{ id: categoryIds },
		);
		const categoryMap = new Map<number, any>(
			(Array.isArray(categoriesRaw) ? categoriesRaw : categoriesRaw.rows).map((c: any) => [c.id, c]),
		);

		const seats = allSeats.map((seat: any) => {
			let status: 'available' | 'locked' | 'sold' | 'maintenance';
			if (seat.seat_condition !== 1) {
				status = 'maintenance';
			} else if (soldSeatIds.has(seat.id)) {
				status = 'sold';
			} else if (lockedSeatIds.has(seat.id)) {
				status = 'locked';
			} else {
				status = 'available';
			}
			const category = categoryMap.get(seat.seat_category) ?? {};
			return {
				id: seat.id,
				row: seat.row_identifier,
				column: seat.column_number,
				label: `${seat.row_identifier}${seat.column_number}`,
				category: { id: category.id ?? null, description: category.description ?? null },
				status,
			};
		});

		const summary = {
			total: seats.length,
			available: seats.filter((s: any) => s.status === 'available').length,
			locked: seats.filter((s: any) => s.status === 'locked').length,
			sold: seats.filter((s: any) => s.status === 'sold').length,
			maintenance: seats.filter((s: any) => s.status === 'maintenance').length,
		};

		let pricing = null;
		if (userId) {
			const activeQuote = await shoppingSessionService.getActiveQuote(userId);
			if (activeQuote) {
				const cacheData = await PricingCacheService.getActiveModifiers();
				if (cacheData) {
					const sessionDate = new Date(activeQuote.created_at || Date.now());
					const currentDate = sessionDate.toISOString().split('T')[0];
					const currentTime = sessionDate.toTimeString().split(' ')[0];
					const currentDay = sessionDate.getDay() === 0 ? 7 : sessionDate.getDay();
					const timeContext = { currentDate, currentTime, currentDay };

					const room = await this._rooms.getById(booking.room, { attributes: ['room_type', 'cinema'] });
					const baseContext = {
						modifier_scope: 1,
						cinemaId: room?.cinema,
						booking_type: booking.booking_type || 1,
						movie: showtime.movie,
						projection_type: showtime.projection_type,
						room_type: room?.room_type || 1,
					};
					const basePricing = PricingService.calculateFinalPrice(
						showtime.price,
						baseContext,
						cacheData.modifiers,
						cacheData.opTypesMap,
						activeQuote.exchange_rates,
						timeContext,
					);
					const pricingMatrix: any[] = [];
					for (const seatCat of cacheData.seatCategories) {
						for (const audCat of cacheData.audienceCategories) {
							const specificContext = {
								...baseContext,
								seat_category: seatCat.id,
								audienceCategoryId: audCat.id,
							};
							const specificPricing = PricingService.calculateFinalPrice(
								basePricing.finalPrice,
								specificContext,
								cacheData.modifiers,
								cacheData.opTypesMap,
								activeQuote.exchange_rates,
								timeContext,
							);
							pricingMatrix.push({
								audience_category: { id: audCat.id, name: audCat.description },
								seat_category: { id: seatCat.id, name: seatCat.description },
								final_price: specificPricing.finalPrice,
								applied_modifiers: specificPricing.appliedModifiers,
							});
						}
					}
					pricing = {
						base_price: basePricing.finalPrice,
						showtime_applied_modifiers: basePricing.appliedModifiers,
						pricing_matrix: pricingMatrix,
					};
				}
			}
		}

		const responseObj: any = {
			showtime_id: showtimeId,
			booking_id: booking.id,
			room_id: booking.room,
			start_time: booking.start_time,
			end_time: booking.end_time,
			summary,
			seats,
		};

		if (pricing) {
			responseObj.pricing = pricing;
		}

		return responseObj;
	}

	async getBillboardFiltered(
		filters: {
			cinemaId?: number;
			movieId?: number;
			projectionType?: string | number;
			language?: string | number;
		} = {},
	) {
		const base = await this.getBillboard(filters);
		if (base.count === 0) return base;

		let rows = base.rows;

		if (filters.movieId) {
			const mid = Number(filters.movieId);
			rows = rows.filter((entry: any) => entry.movie?.id === mid);
		}

		if (filters.projectionType && filters.projectionType !== '') {
			const pt = String(filters.projectionType).toLowerCase();
			rows = rows
				.map((entry: any) => ({
					...entry,
					showtimes: entry.showtimes.filter((s: any) => {
						const desc = (s.projection_type?.description ?? '').toLowerCase();
						const id = String(s.projection_type?.id ?? '');
						return desc.includes(pt) || id === pt;
					}),
				}))
				.filter((entry: any) => entry.showtimes.length > 0);
		}

		if (filters.language && filters.language !== '') {
			const lang = String(filters.language).toLowerCase();
			rows = rows
				.map((entry: any) => ({
					...entry,
					showtimes: entry.showtimes.filter((s: any) => {
						const desc = (s.language?.description ?? '').toLowerCase();
						const id = String(s.language?.id ?? '');
						return desc.includes(lang) || id === lang;
					}),
				}))
				.filter((entry: any) => entry.showtimes.length > 0);
		}

		if (rows.length === 0) {
			throw new NotFoundError(
				'No se encontraron funciones que coincidan con los filtros avanzados seleccionados',
			);
		}

		return { count: rows.length, rows };
	}
}

export default new ShowtimeManagementService();
