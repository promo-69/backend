import { Database } from '@database/index.js';
import { ConflictError, NotFoundError, ValidationError } from '@errors';
import { Transaction, Op } from 'sequelize';

const BOOKING_TYPE_CODE_SHOWTIME = 'SHOWTIME';

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
        return Database.repository('main', 'movie-subscriptions') as any;
    }

    private _relations = [
        { association: '_Movie', attributes: ['title', 'duration_minutes'], required: true },
        { association: '_Room', attributes: ['name'], required: true },
        { association: '_ProjectionType', attributes: ['description'], required: true },
        { association: '_Currency', attributes: ['code', 'symbol'], required: true },
    ];

    private _format(raw: any) {
        if (!raw) return null;
        const movie = raw._Movie || {};
        const room = raw._Room || {};
        const projection = raw._ProjectionType || {};
        const currency = raw._Currency || {};
        return {
            id: raw.id,
            booking: {
                id: raw.id,
                start_time: raw.start_time,
                end_time: raw.end_time,
                room: { id: room.id, name: room.name },
            },
            movie: { id: movie.id, title: movie.title },
            projection_type: { id: projection.id, description: projection.description },
            price: raw.price,
            currency: { id: currency.id, code: currency.code },
            earned_loyalty_points: raw.earned_loyalty_points,
        };
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
            start_time: { [Op.lt]: endTime },
            end_time: { [Op.gt]: startTime },
            deleted_at: null,
        };
        if (excludeBookingId) where.id = { [Op.ne]: excludeBookingId };

        const conflict = await this._roomBookings.getOne(where, { transaction });
        if (conflict) throw new ConflictError('La sala ya está ocupada en ese horario', 'ROOM_ALREADY_BOOKED');
    }

    async createShowtime(data: any) {
        const roomId = data.room;
        const movieId = data.movie;
        const projTypeId = data.projection_type;
        const startTime = data.start_time || data.startTime;
        const endTime = data.end_time || data.endTime;
        const currencyId = data.currency || data.currencyId;
        const price = Number(data.price);
        const earnedLoyaltyPoints = data.earned_loyalty_points ?? data.earnedLoyaltyPoints ?? null;

        if (!roomId || !movieId || !projTypeId || !startTime || !endTime || !currencyId) {
            throw new ValidationError('Faltan datos obligatorios para programar la función');
        }
        if (isNaN(price) || price <= 0) throw new ValidationError('El precio debe ser un número positivo');
        const start = new Date(startTime);
        const end = new Date(endTime);
        if (end <= start) throw new ValidationError('La hora de fin debe ser posterior a la de inicio');

        const result = await this._roomBookings.transaction(async (transaction: Transaction) => {
            await this._checkOverlap(roomId, start, end, undefined, transaction);

            const bookingType = await this._bookingTypes.getOne({ code: BOOKING_TYPE_CODE_SHOWTIME }, { transaction });
            if (!bookingType) throw new ValidationError('Falta el tipo de reserva SHOWTIME en booking_types');

            const booking = await this._roomBookings.create(
                {
                    room: roomId,
                    start_time: start,
                    end_time: end,
                    booking_type: bookingType.id,
                },
                { transaction },
            );

            // Insertar showtime manualmente usando la instancia sequelize del transaction
            const [showtimeRow] = await transaction.sequelize.query(
                `INSERT INTO showtimes (booking, movie, projection_type, currency, price, earned_loyalty_points)
                 VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
                {
                    bind: [booking.id, movieId, projTypeId, currencyId, price, earnedLoyaltyPoints],
                    type: 'INSERT',
                    transaction,
                },
            );
            const showtimeId = (showtimeRow as any).id || (showtimeRow as any)[0]?.id;

            // Transición de ciclo de vida de la película
            const movie = await this._movies.getById(movieId, { transaction });
            if (movie && movie.lifecycle_state !== 2) {
                await this._movies.update(movieId, { lifecycle_state: 2 }, { transaction });
            }

            // Notificación dummy a suscriptores
            try {
                const subscriptions = await this._movieSubscriptions.getAll(
                    { count: false },
                    { movie: movieId, is_notified: false },
                );
                const subList = Array.isArray(subscriptions) ? subscriptions : subscriptions.rows;
                for (const sub of subList) {
                    await this._movieSubscriptions.update(sub.id, { is_notified: true }, { transaction });
                }
            } catch {
                /* no interrumpir */
            }

            return { booking_id: booking.id, showtime_id: showtimeId };
        });

        return result;
    }

    async findAllShowtimes(filters?: any) {
        // 1. Obtener showtimes sin relaciones (solo IDs)
        const rawResult = await this._showtimesRepo.getAll({
            ...filters,
            count: true,
            relations: [],
            attributes: ['id', 'movie', 'projection_type', 'currency', 'price', 'earned_loyalty_points'],
        });
        const showtimesList = Array.isArray(rawResult) ? rawResult : rawResult.rows;
        const total = Array.isArray(rawResult) ? showtimesList.length : rawResult.count;

        if (showtimesList.length === 0) {
            return { count: 0, rows: [] };
        }

        // 2. Recolectar IDs únicos
        const movieIds = [...new Set(showtimesList.map((s: any) => s.movie))];
        const projTypeIds = [...new Set(showtimesList.map((s: any) => s.projection_type))];
        const currencyIds = [...new Set(showtimesList.map((s: any) => s.currency))];

        // 3. Consultar los datos relacionados por lotes
        const [movies, projTypes, currencies] = await Promise.all([
            movieIds.length > 0
                ? Database.repository('main', 'movies').getAll(
                      { count: false, attributes: ['id', 'title'] },
                      { id: movieIds },
                  )
                : [],
            projTypeIds.length > 0
                ? Database.repository('main', 'projection-types').getAll(
                      { count: false, attributes: ['id', 'description'] },
                      { id: projTypeIds },
                  )
                : [],
            currencyIds.length > 0
                ? Database.repository('main', 'currencies').getAll(
                      { count: false, attributes: ['id', 'code'] },
                      { id: currencyIds },
                  )
                : [],
        ]);

        // 4. Mapear a objetos por ID para acceso rápido
        const movieMap = new Map((Array.isArray(movies) ? movies : movies.rows).map((m: any) => [m.id, m]));
        const projMap = new Map((Array.isArray(projTypes) ? projTypes : projTypes.rows).map((p: any) => [p.id, p]));
        const currencyMap = new Map(
            (Array.isArray(currencies) ? currencies : currencies.rows).map((c: any) => [c.id, c]),
        );

        // 5. Formatear la respuesta
        const rows = showtimesList.map((s: any) => {
            const movie = movieMap.get(s.movie) || {};
            const projection = projMap.get(s.projection_type) || {};
            const currency = currencyMap.get(s.currency) || {};
            return {
                id: s.id,
                movie: { id: movie.id, title: movie.title },
                projection_type: { id: projection.id, description: projection.description },
                currency: { id: currency.id, code: currency.code },
                price: s.price,
                earned_loyalty_points: s.earned_loyalty_points,
            };
        });

        return { count: total, rows };
    }

    async findShowtimeById(id: number) {
        const raw = await this._showtimesRepo.getById(id, {
            attributes: ['id', 'movie', 'projection_type', 'currency', 'price', 'earned_loyalty_points'],
            relations: [],
        });
        if (!raw) throw new NotFoundError('Función no encontrada');

        // Resolver las mismas relaciones individualmente
        const [movie, projType, currency] = await Promise.all([
            Database.repository('main', 'movies').getById(raw.movie, { attributes: ['id', 'title'] }),
            Database.repository('main', 'projection-types').getById(raw.projection_type, {
                attributes: ['id', 'description'],
            }),
            Database.repository('main', 'currencies').getById(raw.currency, { attributes: ['id', 'code'] }),
        ]);

        return {
            id: raw.id,
            movie: { id: movie?.id, title: movie?.title },
            projection_type: { id: projType?.id, description: projType?.description },
            currency: { id: currency?.id, code: currency?.code },
            price: raw.price,
            earned_loyalty_points: raw.earned_loyalty_points,
        };
    }

    async updateShowtime(id: number, body: any) {
        const showtime = await this._showtimesRepo.getOne(
            { id },
            { attributes: ['id', 'booking', 'movie', 'projection_type', 'currency', 'price', 'earned_loyalty_points'] },
        );
        if (!showtime) throw new NotFoundError('Función no encontrada');

        const updateData: Record<string, any> = {};
        if (body.price !== undefined) updateData.price = Number(body.price);
        if (body.earned_loyalty_points !== undefined) updateData.earned_loyalty_points = body.earned_loyalty_points;
        if (body.projection_type !== undefined) updateData.projection_type = body.projection_type;
        if (body.currency !== undefined) updateData.currency = body.currency;

        if (Object.keys(updateData).length === 0)
            throw new ValidationError('No se proporcionaron datos para actualizar');

        if (body.room || body.start_time || body.end_time) {
            const booking = await this._roomBookings.getById(showtime.booking);
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
            });
        }

        await this._showtimesRepo.update(id, updateData);
        return null;
    }

    async deleteShowtime(id: number) {
        const showtime = await this._showtimesRepo.getOne(
            { id },
            { attributes: ['id', 'booking', 'movie', 'projection_type', 'currency', 'price', 'earned_loyalty_points'] },
        );
        if (!showtime) throw new NotFoundError('Función no encontrada');

        const ticketCount = await this._tickets.count({ showtime: id, deleted_at: null });
        if (ticketCount > 0)
            throw new ConflictError(
                'No se puede cancelar la función porque tiene boletos vendidos',
                'SHOWTIME_HAS_TICKETS',
            );

        await this._roomBookings.transaction(async (transaction: Transaction) => {
            const booking = await this._roomBookings.getById(showtime.booking, { transaction });
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
