import { Database } from '@database/index.js';
import { NotFoundError, ValidationError, ConflictError } from '@errors';
import { QueueProvider } from '@providers/queue.provider.js';
import { Transaction } from 'sequelize';

// ── Constantes de ciclo de vida ──────────────────────────────────────────────
export const RENTAL_STATUS = {
    PENDING_REVIEW:  1, // Recién creada, sin revisar
    PENDING_PAYMENT: 2, // Aprobada, sala bloqueada, precio fijado
    PAID:            3, // Cliente pagó — reserva permanente
    REJECTED:        4, // Gerente rechazó
    CANCELLED:       5, // Expiró o cancelación manual
} as const;

// booking_types id 3 = 'Alquiler Privado'
const BOOKING_TYPE_RENTAL = 3;

// TTL de expiración de proforma: 48 horas en ms
const PROFORMA_TTL_MS = 48 * 60 * 60 * 1000;

// Cola BullMQ de expiración de proformas
const RENTAL_EXPIRY_QUEUE = 'rental-expiration-queue';

export class RentalManagementService {
    private get _rentalRequests() {
        return Database.repository('main', 'rental-requests') as any;
    }
    private get _roomBookings() {
        return Database.repository('main', 'room-bookings') as any;
    }
    private get _rooms() {
        return Database.repository('main', 'rooms') as any;
    }
    private get _people() {
        return Database.repository('main', 'people') as any;
    }
    private get _customers() {
        return Database.repository('main', 'customers') as any;
    }

    // ── Formato de respuesta ──────────────────────────────────────────────────

    /**
     * Extrae los datos de contacto del solicitante desde la cadena
     * customer → _People (people).
     */
    private _extractContact(raw: any) {
        const people = raw._Customers?._People;
        if (!people) return null;
        return {
            name:  `${people.first_name} ${people.last_name}`.trim(),
            email: people.personal_email ?? null,
            phone: people.phone_number ?? null,
        };
    }

    /** Vista compacta para listas (GET /requests y GET /me). */
    private _formatList(raw: any) {
        const contact = this._extractContact(raw);
        return {
            id: raw.id,
            event_name: raw.event_name,
            contact_name: contact?.name ?? null,
            requested_start_time: raw.requested_start_time,
            status: raw._Statuses
                ? { id: raw._Statuses.id, description: raw._Statuses.description }
                : { id: raw.status },
        };
    }

    /** Vista de detalle exhaustivo para el gerente (GET /requests/:id). */
    private _formatDetail(raw: any) {
        const contact = this._extractContact(raw);
        const room = raw._Rooms;
        const cinema = room?._Cinemas;

        return {
            id: raw.id,
            event_name: raw.event_name,
            event_description: raw.event_description ?? null,
            event_date: raw.event_date,
            requested_start_time: raw.requested_start_time,
            requested_end_time: raw.requested_end_time,
            attendees: raw.attendees ?? null,
            contact_name:  contact?.name  ?? null,
            contact_email: contact?.email ?? null,
            contact_phone: contact?.phone ?? null,
            room:   room   ? { id: room.id,   name: room.name }   : { id: raw.room },
            cinema: cinema ? { id: cinema.id, name: cinema.name } : null,
            event_type: raw._EventTypes
                ? { id: raw._EventTypes.id, description: raw._EventTypes.description }
                : { id: raw.event_type },
            status: raw._Statuses
                ? { id: raw._Statuses.id, description: raw._Statuses.description }
                : { id: raw.status },
            price:    raw.price ?? null,
            currency: raw._Currencies
                ? { id: raw._Currencies.id, code: raw._Currencies.code, symbol: raw._Currencies.symbol }
                : raw.currency ? { id: raw.currency } : null,
        };
    }

    // ── Lectura ───────────────────────────────────────────────────────────────

    /**
     * GET /rentals/requests — gerente lista las solicitudes de su cine.
     * cinemaId se usa para filtrar las salas que pertenecen a ese cine.
     */
    async findAllByCinema(cinemaId: number, filters?: any) {
        // Obtener IDs de salas del cine para filtrar solicitudes
        const rooms = await this._rooms.getAll(
            { count: false, attributes: ['id'] },
            { cinema: cinemaId, deleted_at: null },
        );
        const roomList = Array.isArray(rooms) ? rooms : rooms.rows;
        if (roomList.length === 0) return { count: 0, rows: [] };
        const roomIds = roomList.map((r: any) => r.id);

        const result = await this._rentalRequests.getAll(
            {
                count: true,
                attributes: ['id', 'event_name', 'requested_start_time', 'status'],
                relations: [
                    { association: '_Statuses', attributes: ['id', 'description'] },
                    {
                        association: '_Customers',
                        attributes: ['id', 'person'],
                        include: [{ association: '_People', attributes: ['first_name', 'last_name'] }],
                    },
                ],
                ...filters,
            },
            { room: roomIds },
        );

        const list  = Array.isArray(result) ? result : result.rows;
        const count = Array.isArray(result) ? result.length : result.count;
        return { count, rows: list.map((r: any) => this._formatList(r)) };
    }

    /** GET /rentals/requests/me — cliente ve sus propias solicitudes. */
    async findMyRequests(customerId: number, filters?: any) {
        const result = await this._rentalRequests.getAll(
            {
                count: true,
                attributes: ['id', 'event_name', 'requested_start_time', 'status'],
                relations: [{ association: '_Statuses', attributes: ['id', 'description'] }],
                ...filters,
            },
            { customer: customerId },
        );

        const list  = Array.isArray(result) ? result : result.rows;
        const count = Array.isArray(result) ? result.length : result.count;
        return {
            count,
            rows: list.map((r: any) => ({
                id: r.id,
                event_name: r.event_name,
                requested_start_time: r.requested_start_time,
                status: r._Statuses
                    ? { id: r._Statuses.id, description: r._Statuses.description }
                    : { id: r.status },
            })),
        };
    }

    /** GET /rentals/requests/:id — detalle exhaustivo para el gerente. */
    async findById(id: number, cinemaId?: number) {
        const raw = await this._rentalRequests.getFull(id);
        if (!raw) throw new NotFoundError('Solicitud de alquiler no encontrada');

        // Verificar que la sala de la solicitud pertenece al cine del gerente
        if (cinemaId !== undefined) {
            const room = await this._rooms.getById(raw.room, { attributes: ['id', 'cinema'] });
            if (!room || room.cinema !== cinemaId) {
                throw new NotFoundError('Solicitud de alquiler no encontrada');
            }
        }

        return this._formatDetail(raw);
    }

    // ── Creación ──────────────────────────────────────────────────────────────

    /**
     * POST /rentals/requests — formulario público de solicitud de alquiler.
     *
     * NO bloquea sala. Registra con status 1 (Pendiente de Revisión).
     *
     * Flujo del solicitante:
     *  A) Con sesión de cliente (customerId del JWT):
     *     → Se usa ese customer directamente.
     *
     *  B) Sin sesión (solicitud pública/por taquilla):
     *     → Se reciben contact_name, contact_email, contact_phone, document_number.
     *     → Dentro de la transacción con LOCK:
     *         1. Buscar/crear people por document_number.
     *         2. Buscar/crear customers apuntando a ese people.
     *     → El customer resultante (sin user, sin contraseña) queda vinculado.
     *
     * Así todos los datos de contacto viven en people (fuente única de verdad)
     * y rental_requests.customer siempre tiene un FK válido.
     */
    async createRequest(body: any, existingCustomerId?: number) {
        const {
            room, event_type,
            event_name, event_description,
            event_date, requested_start_time, requested_end_time,
            attendees,
            // Campos de contacto — solo se usan si no hay sesión de cliente
            contact_name, contact_email, contact_phone, document_number,
        } = body;

        // ── Validaciones previas (sin side-effects) ────────────────────────
        if (!room)       throw new ValidationError('La sala es obligatoria');
        if (!event_type) throw new ValidationError('El tipo de evento es obligatorio');
        if (!event_name?.trim()) throw new ValidationError('El nombre del evento es obligatorio');
        if (!event_date)         throw new ValidationError('La fecha del evento es obligatoria');
        if (!requested_start_time) throw new ValidationError('La hora de inicio solicitada es obligatoria');
        if (!requested_end_time)   throw new ValidationError('La hora de fin solicitada es obligatoria');

        const start = new Date(requested_start_time);
        const end   = new Date(requested_end_time);
        if (end <= start) throw new ValidationError('La hora de fin debe ser posterior a la de inicio');

        if (!existingCustomerId) {
            if (!contact_name?.trim())  throw new ValidationError('El nombre de contacto es obligatorio');
            if (!contact_email?.trim()) throw new ValidationError('El email de contacto es obligatorio');
            if (!document_number?.trim()) throw new ValidationError('El número de documento es obligatorio');
        }

        // Verificar que la sala existe
        const roomRecord = await this._rooms.getById(room, { attributes: ['id', 'cinema'] });
        if (!roomRecord) throw new ValidationError('Sala no encontrada');

        // ── Transacción: determinar customer + crear solicitud ─────────────
        const created = await this._rentalRequests.transaction(async (transaction: Transaction) => {
            let customerId = existingCustomerId;

            if (!customerId) {
                // Paso 1: buscar o crear people (LOCK evita duplicados concurrentes)
                let person = await this._people.getOne(
                    { document_number: document_number.trim() },
                    { transaction, lock: transaction.LOCK.UPDATE },
                );

                if (!person) {
                    const nameParts = contact_name.trim().split(' ');
                    person = await this._people.create(
                        {
                            document_number:  document_number.trim(),
                            first_name:       nameParts[0] ?? contact_name.trim(),
                            last_name:        nameParts.slice(1).join(' ') || nameParts[0],
                            personal_email:   contact_email.trim(),
                            phone_number:     contact_phone?.trim() ?? null,
                        },
                        { transaction },
                    );
                }

                // Paso 2: buscar o crear customer para ese people (LOCK)
                let customer = await this._customers.getOne(
                    { person: person.id },
                    { transaction, lock: transaction.LOCK.UPDATE },
                );

                if (!customer) {
                    customer = await this._customers.create(
                        { person: person.id },
                        { transaction },
                    );
                }

                customerId = customer.id;
            }

            // Paso 3: crear la solicitud de alquiler
            return this._rentalRequests.create(
                {
                    customer:             customerId,
                    room:                 Number(room),
                    event_type:           Number(event_type),
                    booking:              null,
                    event_name:           event_name.trim(),
                    event_description:    event_description?.trim() ?? null,
                    event_date,
                    attendees:            attendees ? Number(attendees) : null,
                    requested_start_time: start,
                    requested_end_time:   end,
                    status:               RENTAL_STATUS.PENDING_REVIEW,
                    currency:             null,
                    price:                null,
                },
                { transaction },
            );
        });

        return { request_id: created.id };
    }

    // ── Cambio de estado ──────────────────────────────────────────────────────

    /**
     * PATCH /rentals/requests/:id/status — gerente aprueba o rechaza.
     *
     * APROBACIÓN (status → 2 — Pendiente de Pago):
     *  1. LOCK sobre la solicitud para evitar aprobaciones concurrentes.
     *  2. Validar price + currency.
     *  3. INSERT en room_bookings. El índice GiST de exclusión de PostgreSQL
     *     garantiza unicidad horaria — si hay overlap lanza ConflictError.
     *  4. Enlazar booking a la solicitud y fijar precio/moneda.
     *  5. Encolar job BullMQ con TTL de 48 h para expiración automática.
     *
     * RECHAZO (status → 4):
     *  Solo permitido desde estado 1 (Pendiente de Revisión).
     *
     * CANCELACIÓN MANUAL (status → 5):
     *  Libera la sala si ya estaba bloqueada.
     */
    async updateStatus(id: number, payload: { status: number; currency?: number; price?: string | number }, cinemaId: number) {
        const { status: newStatus, currency, price } = payload;

        const validTransitions: number[] = [
            RENTAL_STATUS.PENDING_PAYMENT,
            RENTAL_STATUS.REJECTED,
            RENTAL_STATUS.CANCELLED,
        ];
        if (!validTransitions.includes(newStatus)) {
            throw new ValidationError(
                `Estado inválido. El gerente puede establecer: ${validTransitions.join(', ')} (Pendiente de Pago, Rechazada, Cancelada)`,
            );
        }

        await this._rentalRequests.transaction(async (transaction: Transaction) => {
            // LOCK: evitar que dos gerentes aprueben/rechacen simultáneamente
            const request = await this._rentalRequests.getById(id, {
                transaction,
                lock: transaction.LOCK.UPDATE,
            });
            if (!request) throw new NotFoundError('Solicitud de alquiler no encontrada');

            // Verificar pertenencia al cine del gerente
            const room = await this._rooms.getById(request.room, { attributes: ['id', 'cinema'] });
            if (!room || room.cinema !== cinemaId) {
                throw new NotFoundError('Solicitud de alquiler no encontrada en este cine');
            }

            // Validar estado actual
            if (request.status === RENTAL_STATUS.PAID) {
                throw new ValidationError('La solicitud ya fue pagada y no puede modificarse');
            }
            if (request.status === RENTAL_STATUS.CANCELLED) {
                throw new ValidationError('La solicitud ya fue cancelada');
            }
            if (request.status === RENTAL_STATUS.REJECTED) {
                throw new ValidationError('La solicitud ya fue rechazada');
            }

            // ── APROBACIÓN ────────────────────────────────────────────────
            if (newStatus === RENTAL_STATUS.PENDING_PAYMENT) {
                if (request.status !== RENTAL_STATUS.PENDING_REVIEW) {
                    throw new ValidationError('Solo se pueden aprobar solicitudes en estado "Pendiente de Revisión"');
                }
                if (!currency) throw new ValidationError('La moneda es obligatoria al aprobar');
                if (!price || isNaN(Number(price)) || Number(price) <= 0) {
                    throw new ValidationError('El precio debe ser un número positivo al aprobar');
                }

                // Bloquear sala — el índice GiST de PostgreSQL detecta overlap
                let booking: any;
                try {
                    booking = await this._roomBookings.create(
                        {
                            room:         request.room,
                            start_time:   request.requested_start_time,
                            end_time:     request.requested_end_time,
                            booking_type: BOOKING_TYPE_RENTAL,
                        },
                        { transaction },
                    );
                } catch (err: any) {
                    if (
                        err.name === 'SequelizeExclusionConstraintError' ||
                        err.message?.includes('chk_room_bookings_no_overlap') ||
                        err.message?.includes('exclusion constraint')
                    ) {
                        throw new ConflictError(
                            'La sala ya está reservada en ese horario. Revisa el calendario antes de aprobar.',
                            'ROOM_OVERLAP',
                        );
                    }
                    throw err;
                }

                await this._rentalRequests.update(
                    id,
                    {
                        status:   RENTAL_STATUS.PENDING_PAYMENT,
                        booking:  booking.id,
                        currency: Number(currency),
                        price:    Number(price),
                    },
                    { transaction },
                );

                // Encolar expiración de proforma (se ejecuta tras el commit)
                const queue = QueueProvider.getInstance();
                await queue.add(
                    RENTAL_EXPIRY_QUEUE,
                    'rental-proforma-expiry',
                    { rentalRequestId: id, bookingId: booking.id },
                    { delay: PROFORMA_TTL_MS },
                );

            // ── RECHAZO ───────────────────────────────────────────────────
            } else if (newStatus === RENTAL_STATUS.REJECTED) {
                if (request.status !== RENTAL_STATUS.PENDING_REVIEW) {
                    throw new ValidationError('Solo se pueden rechazar solicitudes en estado "Pendiente de Revisión"');
                }
                await this._rentalRequests.update(id, { status: RENTAL_STATUS.REJECTED }, { transaction });

            // ── CANCELACIÓN MANUAL ────────────────────────────────────────
            } else if (newStatus === RENTAL_STATUS.CANCELLED) {
                await this._cancelRequest(id, request.booking, transaction);
            }
        });
    }

    // Cancelar solicitud y liberar sala si aplica. Debe llamarse dentro de una transacción activa.
    async _cancelRequest(requestId: number, bookingId: number | null, transaction: Transaction) {
        await this._rentalRequests.update(requestId, { status: RENTAL_STATUS.CANCELLED }, { transaction });
        if (bookingId) {
            await this._roomBookings.delete(bookingId, { transaction });
        }
    }

    // Punto de entrada del worker BullMQ.
    // Si la solicitud sigue en "Pendiente de Pago", la cancela y libera la sala.
    async expireProforma(rentalRequestId: number, bookingId: number | null) {
        await this._rentalRequests.transaction(async (transaction: Transaction) => {
            const request = await this._rentalRequests.getById(rentalRequestId, {
                transaction,
                lock: transaction.LOCK.UPDATE,
            });
            // Si ya fue pagada o cancelada antes de que corriera el worker, no hacer nada
            if (!request || request.status !== RENTAL_STATUS.PENDING_PAYMENT) return;
            await this._cancelRequest(rentalRequestId, bookingId, transaction);
        });
    }
}

export default new RentalManagementService();
