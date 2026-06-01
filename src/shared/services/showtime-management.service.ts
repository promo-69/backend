import { Database, Ops } from '@database/index.js';
import { ConflictError, NotFoundError, ValidationError } from '@errors';
import { Transaction, Op } from 'sequelize';

// ID del tipo de reserva "Película" en la tabla booking_types (seed: id=1, description='Película').
// Se usa como fallback cuando la búsqueda por description no devuelva resultado.
const BOOKING_TYPE_ID_SHOWTIME = 1;

// IDs de lifecycle que significan "en cartelera" (seed-business-catalogs.js)
// 2 = En Cartelera (Estreno), 3 = En Cartelera (Regular), 4 = Últimos Días
const IN_THEATERS_STATES = [2, 3, 4];

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
        };
        if (excludeBookingId) where.id = { [Ops.ne]: excludeBookingId };

        const conflict = await this._roomBookings.getOne(where, { transaction });
        if (conflict) throw new ConflictError('La sala ya está ocupada en ese horario', 'ROOM_ALREADY_BOOKED');
    }

    // ---------------------------------------------------------------------------
    // CARTELERA PÚBLICA
    // ---------------------------------------------------------------------------
    async getBillboard(cinemaId?: number) {
        const now = new Date();

        const activeBookingsWhere: any = {
            end_time: { [Ops.gt]: now },
            deleted_at: null,
        };

        const activeBookings = await this._roomBookings.getAll(
            {
                count: false,
                attributes: ['id', 'room', 'start_time', 'end_time'],
                relations: cinemaId
                    ? [
                          {
                              association: '_Rooms',
                              attributes: ['id', 'name', 'cinema'],
                              required: true,
                              nested: [
                                  {
                                      association: '_Cinemas',
                                      attributes: ['id', 'name'],
                                      required: true,
                                  },
                              ],
                          },
                      ]
                    : [
                          {
                              association: '_Rooms',
                              attributes: ['id', 'name', 'cinema'],
                              required: true,
                          },
                      ],
            },
            activeBookingsWhere,
        );

        const bookingList: any[] = Array.isArray(activeBookings) ? activeBookings : activeBookings.rows;
        if (bookingList.length === 0) return { count: 0, rows: [] };

        const filteredBookings: any[] = cinemaId
            ? bookingList.filter((b: any) => b._Rooms?.cinema === cinemaId)
            : bookingList;
        if (filteredBookings.length === 0) return { count: 0, rows: [] };

        const activeBookingIds = filteredBookings.map((b: any) => b.id);

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
            { booking: activeBookingIds, deleted_at: null },
        );
        const showtimeList: any[] = Array.isArray(showtimes) ? showtimes : showtimes.rows;
        if (showtimeList.length === 0) return { count: 0, rows: [] };

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
            { id: rawMovieIds, lifecycle_state: IN_THEATERS_STATES, deleted_at: null },
        );
        const movieList: any[] = Array.isArray(movies) ? movies : movies.rows;
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
        const bookingMap = new Map<number, any>(filteredBookings.map((b: any) => [b.id, b]));

        const billboardMap = new Map<number, any>();

        for (const s of showtimeList) {
            const movie: any = movieMap.get(s.movie);
            if (!movie) continue;

            const booking: any = bookingMap.get(s.booking);
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
                            ? {
                                  id: movie._AgeClassifications.id,
                                  description: movie._AgeClassifications.description,
                              }
                            : null,
                        genres: Array.isArray(movie._Genres)
                            ? movie._Genres.map((g: any) => ({ id: g.id, description: g.description }))
                            : [],
                    },
                    showtimes: [],
                });
            }

            const proj: any = projMap.get(s.projection_type) ?? {};
            const lang: any = langMap.get(s.language) ?? {};
            const curr: any = currMap.get(s.currency) ?? {};
            const room: any = booking._Rooms ?? {};
            const cinema: any = room._Cinemas ?? null;

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

    // ---------------------------------------------------------------------------
    // FUNCIONES DE UNA PELÍCULA EN UNA SUCURSAL
    // ---------------------------------------------------------------------------
    async getMovieShowtimesByCinema(movieId: number, cinemaId: number) {
        const now = new Date();

        const bookings = await this._roomBookings.getAll(
            {
                count: false,
                attributes: ['id', 'room', 'start_time', 'end_time'],
                relations: [
                    {
                        association: '_Rooms',
                        attributes: ['id', 'name', 'cinema', 'grid_rows', 'grid_columns'],
                        required: true,
                    },
                ],
                order: [['start_time', 'ASC']],
            },
            { end_time: { [Ops.gt]: now }, deleted_at: null },
        );

        const bookingList: any[] = Array.isArray(bookings) ? bookings : bookings.rows;
        const cinemabookings: any[] = bookingList.filter((b: any) => b._Rooms?.cinema === cinemaId);
        if (cinemabookings.length === 0) return { count: 0, rows: [] };

        const bookingIds = cinemabookings.map((b: any) => b.id);

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
        if (showtimeList.length === 0) return { count: 0, rows: [] };

        const movie: any = await this._movies.getById(movieId, {
            attributes: ['id', 'title', 'duration_minutes', 'poster_url', 'lifecycle_state'],
        });
        if (!movie || !IN_THEATERS_STATES.includes(movie.lifecycle_state)) {
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
        const bookingMap = new Map<number, any>(cinemabookings.map((b: any) => [b.id, b]));

        const rows = await Promise.all(
            showtimeList.map(async (s: any) => {
                const booking: any = bookingMap.get(s.booking);
                const room: any = booking?._Rooms ?? {};

                const totalSeats = await this._seats.count({ room: room.id, deleted_at: null });
                const soldSeats = await this._tickets.count({ booking: s.booking, deleted_at: null });

                const proj: any = projMap.get(s.projection_type) ?? {};
                const lang: any = langMap.get(s.language) ?? {};
                const curr: any = currMap.get(s.currency) ?? {};

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

        rows.sort(
            (a: any, b: any) => new Date(a.booking.start_time).getTime() - new Date(b.booking.start_time).getTime(),
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

    // ---------------------------------------------------------------------------
    // GESTIÓN INTERNA DE FUNCIONES
    // ---------------------------------------------------------------------------
    async createShowtime(data: any) {
        const roomId = data.room ?? data.roomId;
        const movieId = data.movie ?? data.movieId;
        const projTypeId = data.projection_type ?? data.projectionTypeId;
        const languageId = data.language ?? data.languageId;
        const startTime = data.start_time ?? data.startTime;
        const endTime = data.end_time ?? data.endTime;
        const currencyId = data.currency ?? data.currencyId;
        const price = Number(data.price);
        const earnedLoyaltyPoints = data.earned_loyalty_points ?? data.earnedLoyaltyPoints ?? null;

        // ── Validaciones de campos obligatorios ───────────────────────────
        if (!roomId) throw new ValidationError('La sala (room) es obligatoria');
        if (!movieId) throw new ValidationError('La película (movie) es obligatoria');
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
        if (start < new Date()) throw new ValidationError('No se puede programar una función en el pasado');

        // ── Validaciones de existencia (fuera de transacción — solo lectura) ──
        const [movie, room, language, currency] = await Promise.all([
            this._movies.getById(movieId, { attributes: ['id', 'title', 'lifecycle_state', 'deleted_at'] }),
            (Database.repository('main', 'rooms') as any).getById(roomId, { attributes: ['id', 'name', 'deleted_at'] }),
            (Database.repository('main', 'languages') as any).getById(languageId, {
                attributes: ['id', 'description'],
            }),
            (Database.repository('main', 'currencies') as any).getById(currencyId, { attributes: ['id', 'code'] }),
        ]);

        if (!movie) throw new ValidationError(`No existe ninguna película con id ${movieId}`);
        if (!room) throw new ValidationError(`No existe ninguna sala con id ${roomId}`);
        if (!language) throw new ValidationError(`No existe ningún idioma con id ${languageId}`);
        if (!currency) throw new ValidationError(`No existe ninguna moneda con id ${currencyId}`);

        // Verificar que la sala admite ese tipo de proyección
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
            await this._checkOverlap(roomId, start, end, undefined, transaction);

            // booking_types no tiene columna "code" — buscar por description.
            // Seed: id=1 → 'Película', id=2 → 'Evento Alternativo', id=3 → 'Alquiler Privado'
            const bookingType: any =
                (await this._bookingTypes.getOne({ description: 'Película' }, { transaction })) ??
                (await this._bookingTypes.getById(BOOKING_TYPE_ID_SHOWTIME, { transaction }));

            if (!bookingType) throw new ValidationError('Falta el tipo de reserva "Película" en booking_types');

            const booking: any = await this._roomBookings.create(
                { room: roomId, start_time: start, end_time: end, booking_type: bookingType.id },
                { transaction },
            );

            const showtime: any = await this._showtimesRepo.create(
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

            const movieRecord: any = await this._movies.getById(movieId, { transaction });
            if (movieRecord && movieRecord.lifecycle_state !== 2) {
                await this._movies.update(movieId, { lifecycle_state: 2 }, { transaction });
            }

            try {
                const subscriptions = await this._movieSubscriptions.getAll(
                    { count: false },
                    { movie: movieId, is_notified: false },
                );
                const subList: any[] = Array.isArray(subscriptions) ? subscriptions : subscriptions.rows;
                for (const sub of subList) {
                    await this._movieSubscriptions.update(sub.id, { is_notified: true }, { transaction });
                }
            } catch {
                /* no interrumpir el flujo principal */
            }

            return { booking_id: booking.id, showtime_id: showtime.id };
        });

        return result;
    }

    async findAllShowtimes(filters?: any) {
        const now = new Date();
        const { date, startDate, endDate, cinemaId, onlyFuture = true, movieId, ...rest } = filters ?? {};

        let targetBookingIds: number[] | undefined;
        const bookingWhere: any = { deleted_at: null };

        if (onlyFuture) {
            bookingWhere.end_time = { [Op.gt]: now };
        }

        // Manejar rangos de fechas
        if (startDate && endDate) {
            const start = new Date(startDate);
            const end = new Date(endDate);
            if (isNaN(start.getTime()) || isNaN(end.getTime())) {
                throw new ValidationError('startDate y endDate deben ser fechas válidas (YYYY-MM-DD)');
            }
            bookingWhere.start_time = { [Op.between]: [start, end] };
        } else if (date) {
            const dayStart = new Date(`${date}T00:00:00.000Z`);
            const dayEnd = new Date(`${date}T23:59:59.999Z`);
            bookingWhere.start_time = { [Op.between]: [dayStart, dayEnd] };
        }

        const needsBookingFilter = cinemaId || date || startDate || onlyFuture;
        if (needsBookingFilter) {
            const bookingQueryOptions: any = {
                count: false,
                attributes: ['id', 'room', 'start_time', 'end_time'],
                relations: [{ association: '_Rooms', attributes: ['id', 'name', 'cinema'], required: true }],
            };
            const allBookings = await this._roomBookings.getAll(bookingQueryOptions, bookingWhere);
            const bookingList: any[] = Array.isArray(allBookings) ? allBookings : allBookings.rows;

            const filtered: any[] = cinemaId
                ? bookingList.filter((b: any) => b._Rooms?.cinema === Number(cinemaId))
                : bookingList;

            targetBookingIds = filtered.map((b: any) => b.id);
            if (targetBookingIds.length === 0) return { count: 0, rows: [] };
        }

        const showtimeWhere: any = { deleted_at: null };
		if (targetBookingIds) showtimeWhere.booking = targetBookingIds;
        if (movieId) showtimeWhere.movie = movieId;

        const rawResult = await this._showtimesRepo.getAll(
            {
                ...rest,
                count: true,
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
            showtimeWhere,
        );
        const showtimesList: any[] = Array.isArray(rawResult) ? rawResult : rawResult.rows;
        const total: number = Array.isArray(rawResult) ? showtimesList.length : rawResult.count;

        if (showtimesList.length === 0) return { count: 0, rows: [] };

        const bookingIds = [...new Set(showtimesList.map((s: any) => s.booking))];
        const movieIds = [...new Set(showtimesList.map((s: any) => s.movie))];
        const projTypeIds = [...new Set(showtimesList.map((s: any) => s.projection_type))];
        const languageIds = [...new Set(showtimesList.map((s: any) => s.language))];
        const currencyIds = [...new Set(showtimesList.map((s: any) => s.currency))];

        const [bookings, movies, projTypes, languages, currencies] = await Promise.all([
            bookingIds.length > 0
                ? this._roomBookings.getAll(
                      {
                          count: false,
                          attributes: ['id', 'room', 'start_time', 'end_time'],
                          relations: [{ association: '_Rooms', attributes: ['id', 'name'], required: false }],
                      },
                      { id: bookingIds },
                  )
                : [],
            movieIds.length > 0
                ? (Database.repository('main', 'movies') as any).getAll(
                      { count: false, attributes: ['id', 'title', 'duration_minutes'] },
                      { id: movieIds },
                  )
                : [],
            projTypeIds.length > 0
                ? (Database.repository('main', 'projection-types') as any).getAll(
                      { count: false, attributes: ['id', 'description'] },
                      { id: projTypeIds },
                  )
                : [],
            languageIds.length > 0
                ? (Database.repository('main', 'languages') as any).getAll(
                      { count: false, attributes: ['id', 'description'] },
                      { id: languageIds },
                  )
                : [],
            currencyIds.length > 0
                ? (Database.repository('main', 'currencies') as any).getAll(
                      { count: false, attributes: ['id', 'code', 'symbol'] },
                      { id: currencyIds },
                  )
                : [],
        ]);

        const bookingMap = new Map<number, any>(
            (Array.isArray(bookings) ? bookings : (bookings as any).rows).map((b: any) => [
                b.id,
                { ...b, _roomName: b._Rooms?.name ?? null },
            ]),
        );
        const movieMap = new Map<number, any>(
            (Array.isArray(movies) ? movies : (movies as any).rows).map((m: any) => [m.id, m]),
        );
        const projMap = new Map<number, any>(
            (Array.isArray(projTypes) ? projTypes : (projTypes as any).rows).map((p: any) => [p.id, p]),
        );
        const langMap = new Map<number, any>(
            (Array.isArray(languages) ? languages : (languages as any).rows).map((l: any) => [l.id, l]),
        );
        const currencyMap = new Map<number, any>(
            (Array.isArray(currencies) ? currencies : (currencies as any).rows).map((c: any) => [c.id, c]),
        );

        const rows = showtimesList.map((s: any) => {
            const booking: any = bookingMap.get(s.booking) ?? {};
            const movie: any = movieMap.get(s.movie) ?? {};
            const projection: any = projMap.get(s.projection_type) ?? {};
            const language: any = langMap.get(s.language) ?? {};
            const currency: any = currencyMap.get(s.currency) ?? {};
            return {
                id: s.id,
                room_booking_id: booking.id,
                start_time: booking.start_time,
                end_time: booking.end_time,
                room: { id: booking.room, name: booking._roomName ?? null },
                movie: { id: movie.id, title: movie.title, duration_minutes: movie.duration_minutes },
                projection_type: { id: projection.id, description: projection.description },
                language: { id: language.id, description: language.description },
                currency: { id: currency.id, code: currency.code, symbol: currency.symbol },
                price: s.price,
                earned_loyalty_points: s.earned_loyalty_points,
            };
        });

        return { count: total, rows };
    }

    async findShowtimeById(id: number) {
        const raw: any = await this._showtimesRepo.getById(id, {
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
        });
        if (!raw) throw new NotFoundError('Función no encontrada');

        const [booking, movie, projType, language, currency] = await Promise.all([
            Database.repository('main', 'room-bookings').getById(raw.booking, {
                attributes: ['id', 'room', 'start_time', 'end_time'],
            }) as Promise<any>,
            Database.repository('main', 'movies').getById(raw.movie, {
                attributes: ['id', 'title', 'duration_minutes'],
            }) as Promise<any>,
            Database.repository('main', 'projection-types').getById(raw.projection_type, {
                attributes: ['id', 'description'],
            }) as Promise<any>,
            Database.repository('main', 'languages').getById(raw.language, {
                attributes: ['id', 'description'],
            }) as Promise<any>,
            Database.repository('main', 'currencies').getById(raw.currency, {
                attributes: ['id', 'code', 'symbol'],
            }) as Promise<any>,
        ]);

        return {
            id: raw.id,
            booking: {
                id: booking?.id,
                room: booking?.room,
                start_time: booking?.start_time,
                end_time: booking?.end_time,
            },
            movie: { id: movie?.id, title: movie?.title, duration_minutes: movie?.duration_minutes },
            projection_type: { id: projType?.id, description: projType?.description },
            language: { id: language?.id, description: language?.description },
            currency: { id: currency?.id, code: currency?.code, symbol: currency?.symbol },
            price: raw.price,
            earned_loyalty_points: raw.earned_loyalty_points,
        };
    }

    async updateShowtime(id: number, body: any) {
        const showtime: any = await this._showtimesRepo.getOne(
            { id },
            {
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
        );
        if (!showtime) throw new NotFoundError('Función no encontrada');

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
            const booking: any = await this._roomBookings.getById(showtime.booking);
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
            });
            return null;
        }

        await this._showtimesRepo.update(id, updateData);
        return null;
    }

    // Mapa de asientos en tiempo real para una función
    async getSeatMap(showtimeId: number) {
        // 1. Obtener el showtime y su booking asociado
        const showtime: any = await this._showtimesRepo.getOne(
            { id: showtimeId },
            { attributes: ['id', 'booking', 'movie', 'projection_type', 'language', 'currency', 'price'] },
        );
        if (!showtime) throw new NotFoundError('Función no encontrada');

        const booking: any = await this._roomBookings.getById(showtime.booking, {
            attributes: ['id', 'room', 'start_time', 'end_time'],
        });
        if (!booking) throw new NotFoundError('Reserva de sala no encontrada');

        // 2. Obtener todos los asientos de la sala (incluyendo los de baja lógica)
        const allSeats: any[] = await this._seats.getAll(
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
            };
        }

        // 3. Obtener IDs de asientos ya vendidos para este booking (tickets confirmados)
        const soldTickets: any[] = await this._tickets.getAll(
            { count: false, attributes: ['seat'] },
            { booking: showtime.booking, deleted_at: null },
        );
        const soldSeatIds = new Set<number>(
            (Array.isArray(soldTickets) ? soldTickets : soldTickets).map((t: any) => t.seat),
        );

        // 4. Consultar Redis para los bloqueos temporales de este booking
        //    Patrón de clave: lock:booking:{bookingId}:seat:{seatId}
        const redis = (await import('@providers/cache-database.provider.js')).CacheDatabaseProvider.getInstance()
            .client;

        const lockPattern = `lock:booking:${booking.id}:seat:*`;
        const lockKeys: string[] = await redis.keys(lockPattern);
        const lockedSeatIds = new Set<number>();

        if (lockKeys.length > 0) {
            for (const key of lockKeys) {
                // key format: lock:booking:{bookingId}:seat:{seatId}
                const parts = key.split(':');
                const seatId = Number(parts[parts.length - 1]);
                if (!isNaN(seatId)) lockedSeatIds.add(seatId);
            }
        }

        // 5. Obtener categorías únicas de asientos para enriquecer la respuesta
        const categoryIds = [...new Set(allSeats.map((s: any) => s.seat_category))];
        const categoriesRaw = await (Database.repository('main', 'seat-categories') as any).getAll(
            { count: false, attributes: ['id', 'description'] },
            { id: categoryIds },
        );
        const categoryMap = new Map<number, any>(
            (Array.isArray(categoriesRaw) ? categoriesRaw : categoriesRaw.rows).map((c: any) => [c.id, c]),
        );

        // 6. Construir el mapa de asientos con estado calculado
        const seats = allSeats.map((seat: any) => {
            let status: 'available' | 'locked' | 'sold' | 'maintenance';

            // seat_condition: 1 = Operativa, 2+ = Dañada / Fuera de Servicio
            if (seat.seat_condition !== 1) {
                status = 'maintenance';
            } else if (soldSeatIds.has(seat.id)) {
                status = 'sold';
            } else if (lockedSeatIds.has(seat.id)) {
                status = 'locked';
            } else {
                status = 'available';
            }

            const category: any = categoryMap.get(seat.seat_category) ?? {};

            return {
                id: seat.id,
                row: seat.row_identifier,
                column: seat.column_number,
                label: `${seat.row_identifier}${seat.column_number}`,
                category: { id: category.id ?? null, description: category.description ?? null },
                status,
            };
        });

        // 7. Estadísticas de disponibilidad
        const summary = {
            total: seats.length,
            available: seats.filter((s) => s.status === 'available').length,
            locked: seats.filter((s) => s.status === 'locked').length,
            sold: seats.filter((s) => s.status === 'sold').length,
            maintenance: seats.filter((s) => s.status === 'maintenance').length,
        };

        return {
            showtime_id: showtimeId,
            booking_id: booking.id,
            room_id: booking.room,
            start_time: booking.start_time,
            end_time: booking.end_time,
            summary,
            seats,
        };
    }

    // Billboard con filtros avanzados
    async getBillboardFiltered(
        filters: {
            cinemaId?: number;
            movieId?: number;
            projectionType?: string | number;
            language?: string | number;
        } = {},
    ) {
        // Primero obtener el billboard base (ya soporta cinemaId)
        const base = await this.getBillboard(filters.cinemaId);
        if (base.count === 0) return base;

        let rows: any[] = base.rows;

        // Filtrar por movieId si se proporciona
        if (filters.movieId) {
            const mid = Number(filters.movieId);
            rows = rows.filter((entry: any) => entry.movie?.id === mid);
        }

        // Filtrar por projectionType (acepta descripción parcial o id numérico)
        if (filters.projectionType !== undefined && filters.projectionType !== '') {
            const pt = String(filters.projectionType).toLowerCase();
            rows = rows
                .map((entry: any) => ({
                    ...entry,
                    showtimes: entry.showtimes.filter((s: any) => {
                        const desc: string = (s.projection_type?.description ?? '').toLowerCase();
                        const id: string = String(s.projection_type?.id ?? '');
                        return desc.includes(pt) || id === pt;
                    }),
                }))
                .filter((entry: any) => entry.showtimes.length > 0);
        }

        // Filtrar por language (acepta descripción parcial o id numérico)
        if (filters.language !== undefined && filters.language !== '') {
            const lang = String(filters.language).toLowerCase();
            rows = rows
                .map((entry: any) => ({
                    ...entry,
                    showtimes: entry.showtimes.filter((s: any) => {
                        const desc: string = (s.language?.description ?? '').toLowerCase();
                        const id: string = String(s.language?.id ?? '');
                        return desc.includes(lang) || id === lang;
                    }),
                }))
                .filter((entry: any) => entry.showtimes.length > 0);
        }

        return { count: rows.length, rows };
    }

    async deleteShowtime(id: number) {
        const showtime: any = await this._showtimesRepo.getOne({ id }, { attributes: ['id', 'booking', 'movie'] });
        if (!showtime) throw new NotFoundError('Función no encontrada');

        const ticketCount = await this._tickets.count({ booking: showtime.booking, deleted_at: null });
        if (ticketCount > 0)
            throw new ConflictError(
                'No se puede cancelar la función porque tiene boletos vendidos',
                'SHOWTIME_HAS_TICKETS',
            );

        await this._roomBookings.transaction(async (transaction: Transaction) => {
            const booking: any = await this._roomBookings.getById(showtime.booking, { transaction });
            await this._showtimesRepo.delete(id, { transaction });
            if (booking) await this._roomBookings.delete(booking.id, { transaction });

            const remaining = await this._showtimesRepo.count(
                { movie: showtime.movie, deleted_at: null },
                { transaction },
            );
            if (remaining === 0) {
                await this._movies.update(showtime.movie, { lifecycle_state: 1 }, { transaction });
            }
        });

        return null;
    }
}

export default new ShowtimeManagementService();
