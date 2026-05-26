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
        {
            association: '_RoomBookings',
            attributes: ['id', 'start_time', 'end_time'],
            include: [{ association: '_Rooms', attributes: ['id', 'name'] }],
        },
        { association: '_Movies', attributes: ['id', 'title'] },
        { association: '_ProjectionTypes', attributes: ['id', 'description'] },
        { association: '_Currencies', attributes: ['id', 'code'] },
    ];

    private _format(raw: any) {
        if (!raw) return null;
        const booking = raw._RoomBookings || {};
        const movie = raw._Movies || {};
        const projection = raw._ProjectionTypes || {};
        const currency = raw._Currencies || {};
        return {
            id: raw.id,
            booking: {
                id: booking.id,
                start_time: booking.start_time,
                end_time: booking.end_time,
                room: booking._Rooms ? { id: booking._Rooms.id, name: booking._Rooms.name } : null,
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
        const {
            room: roomId,
            movie: movieId,
            projection_type: projTypeId,
            start_time,
            end_time,
            currency: currencyId,
            price,
            earned_loyalty_points,
        } = data;

        if (!roomId || !movieId || !projTypeId || !start_time || !end_time || !currencyId) {
            throw new ValidationError('Faltan datos obligatorios para programar la función');
        }
        const start = new Date(start_time);
        const end = new Date(end_time);
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

            const showtime = await this._showtimesRepo.create(
                {
                    booking: booking.id,
                    movie: movieId,
                    projection_type: projTypeId,
                    currency: currencyId,
                    price: price ?? 0,
                    earned_loyalty_points: earned_loyalty_points ?? null,
                },
                { transaction },
            );

            // Transición de ciclo de vida de la película (ejemplo: a "En Cartelera")
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

            return { booking_id: booking.id, showtime_id: showtime.id };
        });

        return result;
    }

    async findAllShowtimes(filters?: any) {
        const options: any = {
            count: true,
            relations: this._relations,
            ...filters,
        };
        if (filters?.cinemaId) {
            options.where = { '$booking.room.cinema$': filters.cinemaId };
        }

        const result = await this._showtimesRepo.getAll(options);
        if (Array.isArray(result)) return result.map((r: any) => this._format(r));
        return {
            ...result,
            rows: result.rows.map((r: any) => this._format(r)),
        };
    }

    async findShowtimeById(id: number) {
        const raw = await this._showtimesRepo.getById(id, { relations: this._relations });
        if (!raw) throw new NotFoundError('Función no encontrada');
        return this._format(raw);
    }

    async updateShowtime(id: number, body: any) {
        const showtime = await this._showtimesRepo.getById(id);
        if (!showtime) throw new NotFoundError('Función no encontrada');

        const updateData: Record<string, any> = {};
        if (body.price !== undefined) updateData.price = body.price;
        if (body.earned_loyalty_points !== undefined) updateData.earned_loyalty_points = body.earned_loyalty_points;
        if (body.projection_type !== undefined) updateData.projection_type = body.projection_type;
        if (body.currency !== undefined) updateData.currency = body.currency;

        if (Object.keys(updateData).length === 0) {
            throw new ValidationError('No se proporcionaron datos para actualizar');
        }

        // Si se cambia el horario/sala, se actualiza room_bookings y valida solapamiento
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
        const showtime = await this._showtimesRepo.getById(id);
        if (!showtime) throw new NotFoundError('Función no encontrada');

        const ticketCount = await this._tickets.count({ showtime: id, deleted_at: null });
        if (ticketCount > 0) {
            throw new ConflictError(
                'No se puede cancelar la función porque tiene boletos vendidos',
                'SHOWTIME_HAS_TICKETS',
            );
        }

        await this._roomBookings.transaction(async (transaction: Transaction) => {
            const booking = await this._roomBookings.getById(showtime.booking, { transaction });
            await this._showtimesRepo.delete(id, { transaction });
            if (booking) await this._roomBookings.delete(booking.id, { transaction });

            // Revertir ciclo de vida si ya no hay funciones
            const remaining = await this._showtimesRepo.count(
                { movie: showtime.movie, deleted_at: null },
                { transaction },
            );
            if (remaining === 0) {
                await this._movies.update(showtime.movie, { lifecycle_state: 1 }, { transaction }); // 1 = Próximamente
            }
        });

        return null;
    }
}

export default new ShowtimeManagementService();
