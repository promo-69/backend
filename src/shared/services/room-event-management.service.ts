import { Database } from '@database/index.js';
import { ConflictError, NotFoundError, ValidationError } from '@errors';
import { Transaction, Op } from 'sequelize';

const BOOKING_TYPE_CODE_EVENT = 'EVENT';

export class RoomEventManagementService {
    private get _roomBookings() {
        return Database.repository('main', 'room-bookings') as any;
    }
    private get _roomEvents() {
        return Database.repository('main', 'room-events') as any;
    }
    private get _showtimes() {
        return Database.repository('main', 'showtimes') as any;
    }
    private get _bookingTypes() {
        return Database.repository('main', 'booking-types') as any;
    }

    private _formatEventResponse(raw: any) {
        if (!raw) return null;
        const booking = raw._RoomBookings || {};
        const eventType = raw._BookingTypes || {};
        const currency = raw._Currencies || {};
        return {
            id: raw.id,
            name: raw.name,
            organizer: raw.organizer,
            description: raw.description,
            event_type: { id: eventType.id, description: eventType.description },
            booking: {
                id: booking.id,
                start_time: booking.start_time,
                end_time: booking.end_time,
                room: booking._Rooms ? { id: booking._Rooms.id, name: booking._Rooms.name } : null,
            },
            price: raw.price,
            currency: { id: currency.id, code: currency.code },
        };
    }

    private get _eventRelations() {
        return [
            {
                association: '_RoomBookings',
                attributes: ['id', 'start_time', 'end_time'],
                include: [{ association: '_Rooms', attributes: ['id', 'name'] }],
            },
            { association: '_BookingTypes', attributes: ['id', 'description'] },
            { association: '_Currencies', attributes: ['id', 'code'] },
        ];
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

        const existingBooking = await this._roomBookings.getOne(where, { transaction });
        if (existingBooking) throw new ConflictError('La sala ya está ocupada en ese horario', 'ROOM_ALREADY_BOOKED');

        const existingShowtime = await this._showtimes.getOne(
            { room: roomId, start_time: { [Op.lt]: endTime }, end_time: { [Op.gt]: startTime }, deleted_at: null },
            { transaction, attributes: ['id'] },
        );
        if (existingShowtime)
            throw new ConflictError('La sala tiene una función de cine programada en ese horario', 'ROOM_HAS_SHOWTIME');
    }

    async createEvent(data: any) {
        const {
            room: roomId,
            event_type: eventTypeId,
            name,
            organizer,
            description,
            start_time: startTime,
            end_time: endTime,
            currency: currencyId,
            price,
        } = data;

        if (!roomId || !eventTypeId || !name || !organizer || !startTime || !endTime || !currencyId) {
            throw new ValidationError('Faltan datos obligatorios para programar el evento');
        }
        const start = new Date(startTime);
        const end = new Date(endTime);
        if (end <= start) throw new ValidationError('La hora de fin debe ser posterior a la de inicio');

        return this._roomBookings.transaction(async (transaction: Transaction) => {
            await this._checkOverlap(roomId, start, end, undefined, transaction);

            const bookingType = await this._bookingTypes.getOne({ code: BOOKING_TYPE_CODE_EVENT }, { transaction });
            if (!bookingType) throw new ValidationError('Falta el tipo de reserva EVENT en booking_types');

            const booking = await this._roomBookings.create(
                {
                    room: roomId,
                    start_time: start,
                    end_time: end,
                    booking_type: bookingType.id,
                },
                { transaction },
            );

            const event = await this._roomEvents.create(
                {
                    booking: booking.id,
                    event_type: eventTypeId,
                    name,
                    organizer,
                    description: description ?? null,
                    currency: currencyId,
                    price: price ?? 0,
                },
                { transaction },
            );

            return { booking_id: booking.id, room_event_id: event.id };
        });
    }

    async findAllEvents(filters?: any) {
        const options: any = { count: true, relations: this._eventRelations, ...filters };
        if (filters?.cinemaId) {
            options.where = { '$booking.room.cinema$': filters.cinemaId };
        }
        const result = await this._roomEvents.getAll(options);
        const format = (r: any) => this._formatEventResponse(r);
        if (Array.isArray(result)) return result.map(format);
        return { ...result, rows: result.rows.map(format) };
    }

    async findEventById(id: number) {
        const raw = await this._roomEvents.getById(id, { relations: this._eventRelations });
        if (!raw) throw new NotFoundError('Evento no encontrado');
        return this._formatEventResponse(raw);
    }

    async updateEvent(id: number, body: any) {
        const event = await this._roomEvents.getById(id);
        if (!event) throw new NotFoundError('Evento no encontrado');

        const updateData: Record<string, any> = {};
        if (body.organizer !== undefined) updateData.organizer = body.organizer;
        if (body.description !== undefined) updateData.description = body.description;
        if (body.price !== undefined) updateData.price = body.price;
        if (body.name !== undefined) updateData.name = body.name;

        if (Object.keys(updateData).length === 0)
            throw new ValidationError('No se proporcionaron datos para actualizar');

        if (body.room || body.start_time || body.end_time) {
            const booking = await this._roomBookings.getById(event.booking);
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

        await this._roomEvents.update(id, updateData);
        return null;
    }

    async deleteEvent(id: number) {
        const event = await this._roomEvents.getById(id);
        if (!event) throw new NotFoundError('Evento no encontrado');

        // TODO: validar tickets cuando exista relación con room_events

        await this._roomBookings.transaction(async (transaction: Transaction) => {
            const booking = await this._roomBookings.getById(event.booking, { transaction });
            await this._roomEvents.delete(id, { transaction });
            if (booking) await this._roomBookings.delete(booking.id, { transaction });
        });

        return null;
    }
}

export default new RoomEventManagementService();
