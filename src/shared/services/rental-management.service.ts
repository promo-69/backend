import { Database, Ops } from '@database/index.js';
import { NotFoundError, ValidationError, ConflictError } from '@errors';
import { QueueProvider } from '@providers/queue.provider.js';
import { Transaction } from 'sequelize';
import { Logger } from '@utils/logger.util.js';

export const RENTAL_STATUS = {
    PENDING_REVIEW: 1,
    PENDING_PAYMENT: 2,
    PAID: 3,
    REJECTED: 4,
    CANCELLED: 5,
} as const;

const BOOKING_TYPE_RENTAL = 3;
const PROFORMA_TTL_MS = 48 * 60 * 60 * 1000;
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

    // ── Helpers de formato ────────────────────────────────────────────────────

    private _extractContact(raw: any) {
        const people = raw._Customers?._People;
        if (!people) return null;
        return {
            name: `${people.first_name} ${people.last_name}`.trim(),
            email: people.personal_email ?? null,
            phone: people.phone_number ?? null,
        };
    }

    private _formatList(raw: any) {
        const contact = this._extractContact(raw);
        const room = raw._Rooms;
        const cinema = raw._Cinemas || room?._Cinemas;
        return {
            id: raw.id,
            event_name: raw.event_name,
            contact_name: contact?.name ?? null,
            requested_start_time: raw.requested_start_time,
            cinema_name: cinema?.name ?? null,
            status: raw._Statuses
                ? { id: raw._Statuses.id, description: raw._Statuses.description }
                : { id: raw.status },
        };
    }

    private _formatDetail(raw: any) {
        const people = raw._Customers?._People;
        const room = raw._Rooms;
        const cinema = raw._Cinemas || room?._Cinemas;

        return {
            id: raw.id,
            event_name: raw.event_name,
            event_description: raw.event_description ?? null,
            event_date: raw.event_date,
            requested_start_time: raw.requested_start_time,
            requested_end_time: raw.requested_end_time,
            attendees: raw.attendees ?? null,
            contact_name: people ? `${people.first_name} ${people.last_name}`.trim() : null,
            contact_email: people?.personal_email ?? null,
            contact_phone: people?.phone_number ?? null,
            room: room ? { id: room.id, name: room.name } : { id: raw.room },
            cinema: cinema ? { id: cinema.id, name: cinema.name } : null,
            event_type: raw._EventTypes
                ? { id: raw._EventTypes.id, description: raw._EventTypes.description }
                : { id: raw.event_type },
            status: raw._Statuses
                ? { id: raw._Statuses.id, description: raw._Statuses.description }
                : { id: raw.status },
            booking_id: raw.booking ?? null,
            price: raw.price ?? null,
            currency: raw._Currencies
                ? { id: raw._Currencies.id, code: raw._Currencies.code, symbol: raw._Currencies.symbol }
                : raw.currency
                  ? { id: raw.currency }
                  : null,
        };
    }

    private _formatAdminList(raw: any) {
        // Extraer datos del cliente explícitamente
        const customerData = raw._Customers;
        const people = customerData?._People;

        const contact = people
            ? {
                  name: `${people.first_name} ${people.last_name}`.trim(),
                  email: people.personal_email ?? null,
              }
            : null;

        const room = raw._Rooms;
        const cinema = raw._Cinemas || room?._Cinemas;

        return {
            id: raw.id,
            event_name: raw.event_name,
            requested_start_time: raw.requested_start_time,
            status: raw._Statuses
                ? { id: raw._Statuses.id, description: raw._Statuses.description }
                : { id: raw.status },
            customer_name: contact?.name ?? null,
            customer_email: contact?.email ?? null,
            cinema_name: cinema?.name ?? null,
            room_name: room?.name ?? null,
            price: raw.price ?? null,
        };
    }

    // ── Lectura para cliente (solo sus solicitudes) ────────────────────────────

    async findMyRequests(customerId: number, filters?: any) {
        if (!customerId) throw new ValidationError('No se pudo identificar al cliente');

        const result = await this._rentalRequests.getAll(
            {
                count: true,
                attributes: ['id', 'event_name', 'requested_start_time', 'status'],
                relations: [{ association: '_Statuses', attributes: ['id', 'description'] }],
                ...filters,
            },
            { customer: customerId },
        );

        const list = Array.isArray(result) ? result : result.rows;
        const count = Array.isArray(result) ? result.length : result.count;
        return {
            count,
            rows: list.map((r: any) => ({
                id: r.id,
                event_name: r.event_name,
                requested_start_time: r.requested_start_time,
                status: r._Statuses ? { id: r._Statuses.id, description: r._Statuses.description } : { id: r.status },
            })),
        };
    }

    // ── Lectura para gerente de sucursal (solo solicitudes de sus salas) ───────

    async findAllByCinema(cinemaId: number, filters?: any) {
        const result = await this._rentalRequests.getAll(
            {
                count: true,
                attributes: ['id', 'event_name', 'requested_start_time', 'status'],
                relations: (Database.repository('main', 'rental-requests') as any).listRelations,
                ...filters,
            },
            { cinema: cinemaId },
        );

        const list = Array.isArray(result) ? result : result.rows;
        const count = Array.isArray(result) ? result.length : result.count;
        return { count, rows: list.map((r: any) => this._formatList(r)) };
    }

    // ── Lectura para superadmin / backoffice (todas las solicitudes con filtros) ─

    async findAllRequests(filters?: any) {
        const { status, startDate, endDate, ...rest } = filters || {};

        const where: any = {};
        if (status) where.status = Number(status);
        if (startDate && endDate) {
            where.requested_start_time = { [Ops.between]: [new Date(startDate), new Date(endDate)] };
        } else if (startDate) {
            where.requested_start_time = { [Ops.gte]: new Date(startDate) };
        } else if (endDate) {
            where.requested_start_time = { [Ops.lte]: new Date(endDate) };
        }

        const result = await this._rentalRequests.getAll(
            {
                count: true,
                attributes: ['id', 'event_name', 'requested_start_time', 'status', 'price'],
                relations: [
                    { association: '_Statuses', attributes: ['id', 'description'] },
                    {
                        association: '_Customers',
                        attributes: ['id', 'person'],
                        include: [
                            {
                                association: '_People',
                                attributes: ['first_name', 'last_name', 'personal_email', 'phone_number'],
                            },
                        ],
                    },
                    {
                        association: '_Rooms',
                        attributes: ['id', 'name'],
                        include: [{ association: '_Cinemas', attributes: ['id', 'name'] }],
                    },
                    {
                        association: '_Cinemas',
                        attributes: ['id', 'name'],
                    },
                ],
                ...rest,
            },
            where,
        );

        const list = Array.isArray(result) ? result : result.rows;
        const count = Array.isArray(result) ? result.length : result.count;
        return { count, rows: list.map((r: any) => this._formatAdminList(r)) };
    }

    // ── Detalle de una solicitud (con verificación de cine) ────────────────────

    async findById(id: number, cinemaId?: number) {
        const raw = await this._rentalRequests.getOne(
            { id },
            {
                relations: [
                    { association: '_Statuses', attributes: ['id', 'description'] },
                    { association: '_EventTypes', attributes: ['id', 'description'] },
                    {
                        association: '_Rooms',
                        attributes: ['id', 'name'],
                        include: [{ association: '_Cinemas', attributes: ['id', 'name'] }],
                    },
                    {
                        association: '_Customers',
                        attributes: ['id'],
                        include: [
                            {
                                association: '_People',
                                attributes: ['first_name', 'last_name', 'personal_email', 'phone_number'],
                            },
                        ],
                    },
                    { association: '_Currencies', attributes: ['id', 'code', 'symbol'] },
                    { association: '_Cinemas', attributes: ['id', 'name'] },
                ],
            },
        );
        if (!raw) throw new NotFoundError('Solicitud de alquiler no encontrada');

        // Solo validar si el usuario tiene cine asignado (empleado, no superadmin)
        if (cinemaId !== undefined && raw.cinema !== cinemaId) {
            throw new NotFoundError('Solicitud de alquiler no encontrada en este cine');
        }

        return this._formatDetail(raw);
    }

    // ── Creación ──────────────────────────────────────────────────────────────

    async createRequest(body: any, existingCustomerId?: number) {
        const {
            room,
            event_type,
            event_name,
            event_description,
            event_date,
            requested_start_time,
            requested_end_time,
            attendees,
            contact_name,
            contact_email,
            contact_phone,
            document_number,
        } = body;

        if (!room) throw new ValidationError('La sala es obligatoria');
        if (!event_type) throw new ValidationError('El tipo de evento es obligatorio');
        if (!event_name?.trim()) throw new ValidationError('El nombre del evento es obligatorio');
        if (!event_date) throw new ValidationError('La fecha del evento es obligatoria');
        if (!requested_start_time) throw new ValidationError('La hora de inicio es obligatoria');
        if (!requested_end_time) throw new ValidationError('La hora de fin es obligatoria');

        const start = new Date(requested_start_time);
        const end = new Date(requested_end_time);
        if (end <= start) throw new ValidationError('La hora de fin debe ser posterior a la de inicio');

        if (!existingCustomerId) {
            if (!contact_name?.trim()) throw new ValidationError('El nombre de contacto es obligatorio');
            if (!contact_email?.trim()) throw new ValidationError('El email de contacto es obligatorio');
            if (!document_number?.trim()) throw new ValidationError('El número de documento es obligatorio');
        }

        const roomRecord = await this._rooms.getById(room, { attributes: ['id', 'cinema'] });
        if (!roomRecord) throw new ValidationError('Sala no encontrada');
        const cinemaId = roomRecord.cinema;

        const created = await this._rentalRequests.transaction(async (transaction: Transaction) => {
            let customerId = existingCustomerId;

            if (!customerId) {
                let person = await this._people.getOne(
                    { document_number: document_number.trim() },
                    { transaction, lock: transaction.LOCK.UPDATE },
                );
                if (!person) {
                    const parts = contact_name.trim().split(' ');
                    person = await this._people.create(
                        {
                            document_number: document_number.trim(),
                            first_name: parts[0] ?? contact_name.trim(),
                            last_name: parts.slice(1).join(' ') || parts[0],
                            personal_email: contact_email.trim(),
                            phone_number: contact_phone?.trim() ?? null,
                        },
                        { transaction },
                    );
                }

                let customer = await this._customers.getOne(
                    { person: person.id },
                    { transaction, lock: transaction.LOCK.UPDATE },
                );
                if (!customer) {
                    customer = await this._customers.create({ person: person.id }, { transaction });
                }

                customerId = customer.id;
            }

            return this._rentalRequests.create(
                {
                    customer: customerId,
                    room: Number(room),
                    cinema: cinemaId,
                    event_type: Number(event_type),
                    booking: null,
                    event_name: event_name.trim(),
                    event_description: event_description?.trim() ?? null,
                    event_date,
                    attendees: attendees ? Number(attendees) : null,
                    requested_start_time: start,
                    requested_end_time: end,
                    status: RENTAL_STATUS.PENDING_REVIEW,
                    currency: null,
                    price: null,
                },
                { transaction },
            );
        });

        return { request_id: created.id };
    }

    // ── Cambio de estado (gerente) ────────────────────────────────────────────

    async updateStatus(
        id: number,
        payload: { status: number; currency?: number; price?: string | number },
        cinemaId: number | undefined,
    ) {
        const { status: newStatus, currency, price } = payload;

        const validTransitions: number[] = [
            RENTAL_STATUS.PENDING_PAYMENT,
            RENTAL_STATUS.REJECTED,
            RENTAL_STATUS.CANCELLED,
        ];
        if (!validTransitions.includes(newStatus)) {
            throw new ValidationError(
                `Estado inválido. Valores permitidos: ${validTransitions.join(', ')} (Pendiente de Pago, Rechazada, Cancelada)`,
            );
        }

        await this._rentalRequests.transaction(async (transaction: Transaction) => {
            const request = await this._rentalRequests.getById(id, {
                transaction,
                lock: transaction.LOCK.UPDATE,
            });
            if (!request) throw new NotFoundError('Solicitud de alquiler no encontrada');

            // Solo validar si el usuario tiene cine asignado (empleado, no superadmin)
            if (cinemaId !== undefined && request.cinema !== cinemaId) {
                throw new NotFoundError('Solicitud de alquiler no encontrada en este cine');
            }

            if (request.status === RENTAL_STATUS.PAID) throw new ValidationError('La solicitud ya fue pagada');
            if (request.status === RENTAL_STATUS.CANCELLED) throw new ValidationError('La solicitud ya fue cancelada');
            if (request.status === RENTAL_STATUS.REJECTED) throw new ValidationError('La solicitud ya fue rechazada');

            // ── APROBACIÓN ────────────────────────────────────────────────
            if (newStatus === RENTAL_STATUS.PENDING_PAYMENT) {
                if (request.status !== RENTAL_STATUS.PENDING_REVIEW) {
                    throw new ValidationError('Solo se pueden aprobar solicitudes en estado "Pendiente de Revisión"');
                }
                if (!currency) throw new ValidationError('La moneda es obligatoria al aprobar');
                if (!price || isNaN(Number(price)) || Number(price) <= 0) {
                    throw new ValidationError('El precio debe ser un número positivo al aprobar');
                }

                let booking: any;
                try {
                    booking = await this._roomBookings.create(
                        {
                            room: request.room,
                            start_time: request.requested_start_time,
                            end_time: request.requested_end_time,
                            booking_type: BOOKING_TYPE_RENTAL,
                        },
                        { transaction },
                    );
                } catch (err: any) {
                    if (
                        err.name === 'SequelizeExclusionConstraintError' ||
                        err.message?.includes('exclusion constraint')
                    ) {
                        throw new ConflictError('La sala ya está reservada en ese horario.', 'ROOM_OVERLAP');
                    }
                    throw err;
                }

                await this._rentalRequests.update(
                    id,
                    {
                        status: RENTAL_STATUS.PENDING_PAYMENT,
                        booking: booking.id,
                        currency: Number(currency),
                        price: Number(price),
                    },
                    { transaction },
                );

                const queue = QueueProvider.getInstance();
                await queue.add(
                    RENTAL_EXPIRY_QUEUE,
                    'rental-proforma-expiry',
                    { rentalRequestId: id, bookingId: booking.id },
                    { delay: PROFORMA_TTL_MS },
                );

                // ENVÍO DE NOTIFICACIÓN AL SOLICITANTE (fuera de transacción)
                this._sendApprovalNotification(request, Number(price), booking.id, request.id);

                // ── RECHAZO ───────────────────────────────────────────────────
            } else if (newStatus === RENTAL_STATUS.REJECTED) {
                if (request.status !== RENTAL_STATUS.PENDING_REVIEW) {
                    throw new ValidationError('Solo se pueden rechazar solicitudes en estado "Pendiente de Revisión"');
                }
                await this._rentalRequests.update(id, { status: RENTAL_STATUS.REJECTED }, { transaction });

                // NOTIFICACIÓN DE RECHAZO
                this._sendRejectionNotification(request);

                // ── CANCELACIÓN ───────────────────────────────────────────────
            } else if (newStatus === RENTAL_STATUS.CANCELLED) {
                await this._cancelRequest(id, request.booking, transaction);
            }
        });
    }

    // ── Confirmación de pago ──────────────────────────────────────────────────

    async confirmPayment(id: number, verifiedCustomerId?: number, cinemaId?: number) {
        await this._rentalRequests.transaction(async (transaction: Transaction) => {
            const request = await this._rentalRequests.getById(id, {
                transaction,
                lock: transaction.LOCK.UPDATE,
            });
            if (!request) throw new NotFoundError('Solicitud de alquiler no encontrada');

            if (verifiedCustomerId && request.customer !== verifiedCustomerId) {
                throw new NotFoundError('Solicitud de alquiler no encontrada');
            }
            // Solo validar si el usuario tiene cine asignado (empleado, no superadmin)
            if (cinemaId !== undefined && request.cinema !== cinemaId) {
                throw new NotFoundError('Solicitud de alquiler no encontrada en este cine');
            }

            if (request.status !== RENTAL_STATUS.PENDING_PAYMENT) {
                throw new ValidationError(
                    request.status === RENTAL_STATUS.PAID
                        ? 'La solicitud ya fue pagada'
                        : request.status === RENTAL_STATUS.CANCELLED
                          ? 'La solicitud fue cancelada (la proforma expiró o fue cancelada manualmente)'
                          : 'La solicitud no está en estado "Pendiente de Pago"',
                );
            }

            await this._rentalRequests.update(id, { status: RENTAL_STATUS.PAID }, { transaction });
        });
    }

    // ── Helpers internos ──────────────────────────────────────────────────────

    async _cancelRequest(requestId: number, bookingId: number | null, transaction: Transaction) {
        await this._rentalRequests.update(requestId, { status: RENTAL_STATUS.CANCELLED }, { transaction });
        if (bookingId) {
            await this._roomBookings.delete(bookingId, { transaction });
        }
    }

    async expireProforma(rentalRequestId: number, bookingId: number | null) {
        await this._rentalRequests.transaction(async (transaction: Transaction) => {
            const request = await this._rentalRequests.getById(rentalRequestId, {
                transaction,
                lock: transaction.LOCK.UPDATE,
            });
            if (!request || request.status !== RENTAL_STATUS.PENDING_PAYMENT) return;
            await this._cancelRequest(rentalRequestId, bookingId, transaction);
        });
    }

    private async _sendApprovalNotification(request: any, price: number, bookingId: number, roomId: number) {
        try {
            const customer = await this._customers.getById(request.customer, {
                include: [{ association: '_People', attributes: ['personal_email', 'first_name', 'last_name'] }],
            });

            const email = customer?._People?.personal_email;
            if (!email) {
                Logger.warn(`No se pudo enviar notificación de aprobación: cliente ${request.customer} sin email`);
                return;
            }

            const room = await this._rooms.getById(roomId, {
                attributes: ['name'],
                include: [{ association: '_Cinemas', attributes: ['id', 'name'] }],
            });

            const roomName = room?.name ?? 'Sala no especificada';
            const cinemaName = room?._Cinemas?.name ?? 'Cine no especificado';

            const { emailService } = await import('@services/email.service.js');

            await emailService.sendRentalApproval(email, request.event_name, roomName, cinemaName, price, request.id);
        } catch (err) {
            const error = err instanceof Error ? err : new Error(String(err));
            Logger.error('Error al enviar notificación de aprobación:', error);
        }
    }

    private async _sendRejectionNotification(request: any) {
        try {
            const customer = await this._customers.getById(request.customer, {
                include: [{ association: '_People', attributes: ['personal_email', 'first_name', 'last_name'] }],
            });

            const email = customer?._People?.personal_email;
            if (!email) return;

            const { emailService } = await import('@services/email.service.js');

            await emailService.sendRentalRejection(email, request.event_name, request.id);
        } catch (err) {
            const error = err instanceof Error ? err : new Error(String(err));
            Logger.error('Error al enviar notificación de rechazo:', error);
        }
    }
}

export default new RentalManagementService();
