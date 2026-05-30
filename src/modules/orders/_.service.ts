import { BaseService } from '@bases/service.base.js';
import { Database, Ops } from '@database/index.js';
import { CacheDatabaseProvider } from '@providers/cache-database.provider.js';
import { QueueProvider } from '@providers/queue.provider.js';
import { RealtimeService } from '@services/realtime.service.js';
import {
    NotFoundError,
    ValidationError,
    ActiveSessionError,
    BadRequestError,
    ForbiddenError,
    ConflictError,
} from '@errors/index.js';
import { Transaction } from 'sequelize';
import { randomUUID } from 'crypto';
import { JWTUtil } from '@utils/jwt.util.js';
import { AppConfig } from '@config/app.config.js';
import { Logger } from '@utils/logger.util.js';

export class OrdersService extends BaseService {
    constructor() {
        super();
    }

    private get _redis() {
        return CacheDatabaseProvider.getInstance().client;
    }
    private get _orders() {
        return Database.repository('main', 'orders') as any;
    }
    private get _tickets() {
        return Database.repository('main', 'tickets') as any;
    }
    private get _orderLines() {
        return Database.repository('main', 'order-lines') as any;
    }
    private get _orderPayments() {
        return Database.repository('main', 'order-payments') as any;
    }
    private get _exchangeRates() {
        return Database.repository('main', 'exchange-rates') as any;
    }
    private get _inventories() {
        return Database.repository('main', 'inventories') as any;
    }
    private get _inventoryMovements() {
        return Database.repository('main', 'inventory-movements') as any;
    }
    private get _products() {
        return Database.repository('main', 'products') as any;
    }
    private get _comboProducts() {
        return Database.repository('main', 'combo-products') as any;
    }
    private get _combos() {
        return Database.repository('main', 'combos') as any;
    }
    private get _priceModifiers() {
        return Database.repository('main', 'price-modifiers') as any;
    }
    private get _taxRules() {
        return Database.repository('main', 'tax-rules') as any;
    }
    private get _orderTaxes() {
        return Database.repository('main', 'order-taxes') as any;
    }
    private get _appliedPriceModifiers() {
        return Database.repository('main', 'applied-price-modifiers') as any;
    }
    // Repositorio de clientes para mapear userId -> customerId
    private get _customers() {
        return Database.repository('main', 'customers') as any;
    }
    // Repositorio para registrar puntos de lealtad tras el pago
    private get _loyaltyLedgers() {
        return Database.repository('main', 'loyalty-ledgers') as any;
    }
    // Helper — session.customerId está en el JWT desde la corrección en auth service.
    // Como fallback, busca en DB por person en caso de tokens generados antes del fix.
    private async _getCustomerIdFromSession(session: any, transaction?: any): Promise<number> {
        if (session.customerId) return Number(session.customerId);
        // Fallback: buscar por persona ligada al usuario
        const customer = await this._customers.getOne(
            { person: session.personId ?? null },
            { attributes: ['id'], ...(transaction ? { transaction } : {}) },
        );
        if (!customer) {
            throw new NotFoundError('No se encontró el perfil de cliente asociado a este usuario');
        }
        return customer.id;
    }

    async createQuote(body: { cinema: number }, session: any) {
        const { cinema } = body;
        if (!cinema) throw new ValidationError('Cinema ID is required', []);

        // 1. BLINDAJE: Verificación de sesión activa (1 sola sesión por usuario)
        const userQueueKey = `queue:usr:${session.userId}`;
        const existingQuote = await this._redis.get(userQueueKey);

        if (existingQuote) {
            throw new ActiveSessionError(
                'Ya tienes una sesión de compra en curso. Por favor finalízala o espera 10 minutos a que expire.',
            );
        }

        // Fetch latest exchange rate correctly (Regla 2)
        const latestRates = await this._exchangeRates.getAll({ count: false, limit: 1, order: [['id', 'DESC']] });
        const activeRate = latestRates[0] || null;

        const queueId = randomUUID();
        const quoteData = {
            queue_id: queueId, // Lo guardamos dentro del payload por seguridad
            status: 'pending',
            cinema,
            exchange_rates: activeRate,
            created_at: Date.now(),
        };

        // 2. Guardamos usando estrictamente el ID del usuario como llave
        await this._redis.set(userQueueKey, JSON.stringify(quoteData), 'EX', 600);

        return {
            queue_id: queueId,
            expires_in: 600,
        };
    }

    async processCheckout(body: any, session: any) {
        const { queue_id, concessions, tickets = [] } = body;
        if (!queue_id) throw new ValidationError('Queue ID is required', []);

        // 1. Busca la llave única del usuario
        const userQueueKey = `queue:usr:${session.userId}`;
        const quoteRaw = await this._redis.get(userQueueKey);

        if (!quoteRaw) throw new BadRequestError('La sesión de compra ha expirado o no existe.');

        const quoteData = JSON.parse(quoteRaw);

        // 2. Validamos el UUID interno
        if (quoteData.queue_id !== queue_id)
            throw new ForbiddenError('El identificador de la sesión de compra es inválido.');

        if (quoteData.status === 'en proceso') throw new ConflictError('La cotización ya ha sido procesada.');

        // Validar asientos pre-seleccionados con Redis
        const hasTickets = tickets.length > 0;
        if (hasTickets) {
            for (const ticket of tickets) {
                const lockKey = `lock:booking:${ticket.booking}:seat:${ticket.seat}`;
                const lockedUserId = await this._redis.get(lockKey);
                if (!lockedUserId || lockedUserId !== String(session.userId)) {
                    throw new ConflictError(
                        'Uno de los asientos seleccionados ya no está disponible o expiró su tiempo de reserva',
                    );
                }
            }
        }

        const hasConcessions = concessions && concessions.length > 0;

        if (!hasTickets && !hasConcessions) throw new ValidationError('El carrito está completamente vacío.', []);

        let createdOrder: any = null;

        try {
            await this._orders.transaction(async (transaction: Transaction) => {
                const requiredProducts: Record<number, number> = {};

                if (hasConcessions) {
                    for (const item of concessions) {
                        if (item.line_type === 1 && item.product) {
                            // Es un producto directo
                            requiredProducts[item.product] = (requiredProducts[item.product] || 0) + item.quantity;
                        } else if (item.line_type === 2 && item.combo) {
                            // Es un Combo: Explosión de Materiales (BOM)
                            const comboParts = await this._comboProducts.getAll(
                                { count: false, operation: { transaction } },
                                { combo: item.combo },
                            );
                            for (const part of comboParts) {
                                requiredProducts[part.product] =
                                    (requiredProducts[part.product] || 0) + part.quantity * item.quantity;
                            }
                        }
                    }
                }

                // ORDEN ESTRICTO: Para evitar Deadlocks en PostgreSQL, siempre bloqueamos IDs en orden ascendente
                const productIds = Object.keys(requiredProducts)
                    .map(Number)
                    .sort((a, b) => a - b);

                if (productIds.length > 0) {
                    // Bloqueo pesimista (FOR UPDATE)
                    const inventories = await this._inventories.getAll(
                        {
                            count: false,
                            order: [['product', 'ASC']],
                            operation: { transaction, lock: transaction.LOCK.UPDATE },
                        },
                        {
                            cinema: quoteData.cinema,
                            product: productIds,
                        },
                    );

                    if (inventories.length !== productIds.length)
                        throw new NotFoundError('Uno o más productos no existen en el inventario de esta sucursal.');

                    for (const inv of inventories) {
                        const requiredQty = requiredProducts[inv.product];

                        // Consultar stock comprometido en órdenes PENDING (order_status = 1) o APPROVED válidas
                        const pendingLines = await this._orderLines.getAll(
                            {
                                count: false,
                                relations: [
                                    {
                                        association: '_Orders',
                                        required: true,
                                        where: { [Ops.and]: [{ order_status: [1] }] },
                                    },
                                ],
                                operation: { transaction },
                            },
                            { product: inv.product },
                        );

                        let pendingQty = 0;
                        for (const line of pendingLines) pendingQty += line.quantity;

                        // Fórmula maestra de negocio: Stock Físico - Stock Mínimo de Seguridad - Stock Reservado
                        const availableStock = inv.stock - inv.minimum_stock - pendingQty;

                        if (availableStock < requiredQty)
                            throw new ConflictError(
                                `Inventario insuficiente para producto ID ${inv.product}. Disponible real: ${Math.max(0, availableStock)}`,
                            );
                    }
                }

                let subtotalBase = 0;
                let taxesBase = 0;

                const exchangeRateValue = Number(quoteData.exchange_rates?.rate || 1);
                const exchangeRateId = quoteData.exchange_rates?.id || 1;
                const orderTaxesCollector: Record<number, { rate: number; amount: number }> = {};

                // Traer reglas activas para el cine
                const activeModifiers = await this._priceModifiers.getAll(
                    { count: false, operation: { transaction } },
                    { cinema: [quoteData.cinema, null] },
                );
                const activeTaxes = await this._taxRules.getAll(
                    { count: false, relations: [{ association: '_Taxes' }], operation: { transaction } },
                    { cinema: [quoteData.cinema, null] },
                );

                // Cálculos Confitería
                if (hasConcessions) {
                    for (const item of concessions) {
                        const basePrice =
                            item.line_type === 1
                                ? Number((await this._products.getById(item.product, { transaction })).price)
                                : Number((await this._combos.getById(item.combo, { transaction })).price);

                        let finalUnitPrice = basePrice;

                        // Aplicar Modificadores (Scope 2: Confitería)
                        const modifiers = activeModifiers.filter(
                            (m: any) =>
                                m.modifier_scope === 2 &&
                                (m.product === item.product || m.combo === item.combo || m.product === null),
                        );
                        item.appliedModifiers = [];
                        for (const mod of modifiers) {
                            const opType = (await (Database.repository('main', 'operation-types') as any).getById(
                                mod.operation_type,
                                { transaction },
                            )) as any;
                            const modValue = mod.is_percentage
                                ? basePrice * (Number(mod.value) / 100)
                                : Number(mod.value);
                            const netChange = opType.is_increment ? modValue : -modValue;
                            finalUnitPrice += netChange;
                            item.appliedModifiers.push({
                                price_modifier: mod.id,
                                applied_amount_base_currency: netChange * item.quantity * exchangeRateValue,
                            });
                        }

                        finalUnitPrice = Math.max(0, finalUnitPrice);
                        subtotalBase += finalUnitPrice * item.quantity;

                        // Aplicar Impuestos
                        const itemTaxes = activeTaxes.filter(
                            (t: any) =>
                                t.tax_scope === 2 &&
                                (t.product === item.product || t.combo === item.combo || t.product === null),
                        );
                        for (const rule of itemTaxes) {
                            const taxRate = Number(rule._Taxes?.rate ?? 0);
                            const taxAmount = finalUnitPrice * item.quantity * (taxRate / 100);
                            taxesBase += taxAmount;
                            if (!orderTaxesCollector[rule.tax])
                                orderTaxesCollector[rule.tax] = { rate: taxRate, amount: 0 };
                            orderTaxesCollector[rule.tax].amount += taxAmount * exchangeRateValue;
                        }

                        item.originalPrice = basePrice;
                        item.finalPrice = finalUnitPrice;
                    }
                }

                // Cálculos Boletos
                if (hasTickets) {
                    for (const ticket of tickets) {
                        // _Showtimes es hasMany (array) — tomar el primer elemento para el precio
                        const bookingDb = (await (Database.repository('main', 'room-bookings') as any).getById(
                            ticket.booking,
                            { transaction, relations: [{ association: '_Showtimes' }] },
                        )) as any;
                        const showtimeData = Array.isArray(bookingDb._Showtimes)
                            ? bookingDb._Showtimes[0]
                            : bookingDb._Showtimes;
                        const basePrice = showtimeData ? Number(showtimeData.price || 0) : 0;
                        let finalUnitPrice = basePrice;

                        // Aplicar Modificadores (Scope 1: Boletería)
                        const modifiers = activeModifiers.filter((m: any) => m.modifier_scope === 1);
                        ticket.appliedModifiers = [];
                        for (const mod of modifiers) {
                            const opType = (await (Database.repository('main', 'operation-types') as any).getById(
                                mod.operation_type,
                                { transaction },
                            )) as any;
                            const modValue = mod.is_percentage
                                ? basePrice * (Number(mod.value) / 100)
                                : Number(mod.value);
                            const netChange = opType.is_increment ? modValue : -modValue;
                            finalUnitPrice += netChange;
                            ticket.appliedModifiers.push({
                                price_modifier: mod.id,
                                applied_amount_base_currency: netChange * exchangeRateValue,
                            });
                        }

                        finalUnitPrice = Math.max(0, finalUnitPrice);
                        subtotalBase += finalUnitPrice;

                        // Aplicar Impuestos
                        const ticketTaxes = activeTaxes.filter((t: any) => t.tax_scope === 1);
                        for (const rule of ticketTaxes) {
                            const ticketTaxRate = Number(rule._Taxes?.rate ?? 0);
                            const taxAmount = finalUnitPrice * (ticketTaxRate / 100);
                            taxesBase += taxAmount;
                            if (!orderTaxesCollector[rule.tax])
                                orderTaxesCollector[rule.tax] = { rate: ticketTaxRate, amount: 0 };
                            orderTaxesCollector[rule.tax].amount += taxAmount * exchangeRateValue;
                        }

                        ticket.originalPrice = basePrice;
                        ticket.finalPrice = finalUnitPrice;
                    }
                }

                // Convertir a moneda base usando la tasa de cambio congelada
                const totalBase = (subtotalBase + taxesBase) * exchangeRateValue;

                // Crear Orden PENDIENTE
                // Session.userId es users.id; orders.customer referencia customers.id
                const customerId = await this._getCustomerIdFromSession(session, transaction);
                createdOrder = await this._orders.create(
                    {
                        customer: customerId,
                        cinema: quoteData.cinema,
                        system_base_currency: quoteData.exchange_rates?.currency || 1,
                        subtotal_base_currency: subtotalBase * exchangeRateValue,
                        tax_amount_base_currency: taxesBase * exchangeRateValue,
                        total_amount_base_currency: totalBase,
                        generated_points: Math.floor(totalBase), // Regla básica de CinePuntos
                        order_status: 1, // PENDING
                    },
                    { transaction },
                );

                // Guardar Impuestos Recolectados
                const taxesToInsert = Object.keys(orderTaxesCollector).map((taxId) => ({
                    order: createdOrder.id,
                    tax: Number(taxId),
                    applied_rate: orderTaxesCollector[Number(taxId)].rate,
                    tax_amount_base_currency: orderTaxesCollector[Number(taxId)].amount,
                }));
                if (taxesToInsert.length > 0) {
                    await this._orderTaxes.bulkCreate(taxesToInsert, { transaction });
                }

                // Líneas de Confitería
                if (hasConcessions) {
                    const linesToInsert = concessions.map((concession: any) => ({
                        order: createdOrder.id,
                        line_type: concession.line_type,
                        product: concession.product || null,
                        combo: concession.combo || null,
                        quantity: concession.quantity,
                        original_unit_price: concession.originalPrice,
                        unit_price: concession.finalPrice,
                        quoted_exchange_rate: exchangeRateId,
                    }));

                    const createdLines = await this._orderLines.bulkCreate(linesToInsert, { transaction });

                    const modifiersToInsert: any[] = [];
                    for (let i = 0; i < concessions.length; i++) {
                        const concession = concessions[i];
                        const createdLine = createdLines[i];

                        if (concession.appliedModifiers && concession.appliedModifiers.length > 0) {
                            for (const mod of concession.appliedModifiers) {
                                modifiersToInsert.push({
                                    order: createdOrder.id,
                                    order_line: createdLine.id,
                                    price_modifier: mod.price_modifier,
                                    applied_amount_base_currency: mod.applied_amount_base_currency,
                                });
                            }
                        }
                    }

                    if (modifiersToInsert.length > 0) {
                        await this._appliedPriceModifiers.bulkCreate(modifiersToInsert, { transaction });
                    }
                }

                // Líneas de Boletos
                if (hasTickets) {
                    const ticketsToInsert = tickets.map((ticket: any) => ({
                        order: createdOrder.id,
                        booking: ticket.booking,
                        seat: ticket.seat,
                        original_price: ticket.originalPrice,
                        price: ticket.finalPrice,
                        quoted_exchange_rate: exchangeRateId,
                        qr_code: randomUUID(), // Temporal, se reemplazará por JWT al confirmar pago
                    }));

                    const createdTickets = await this._tickets.bulkCreate(ticketsToInsert, { transaction });

                    const modifiersToInsert: any[] = [];
                    for (let i = 0; i < tickets.length; i++) {
                        const ticket = tickets[i];
                        const createdTicket = createdTickets[i];

                        if (ticket.appliedModifiers && ticket.appliedModifiers.length > 0) {
                            for (const mod of ticket.appliedModifiers) {
                                modifiersToInsert.push({
                                    order: createdOrder.id,
                                    ticket: createdTicket.id,
                                    price_modifier: mod.price_modifier,
                                    applied_amount_base_currency: mod.applied_amount_base_currency,
                                });
                            }
                        }
                    }

                    if (modifiersToInsert.length > 0) {
                        await this._appliedPriceModifiers.bulkCreate(modifiersToInsert, { transaction });
                    }
                }
            });

            // 4. Disparar el Delayed Job para limpiar órdenes abandonadas (10 minutos)
            QueueProvider.getInstance()
                .add(
                    'order-expiration-queue',
                    'expire-pending-order',
                    { orderId: createdOrder.id, queueId: queue_id },
                    { delay: 600_000 },
                )
                .catch((err) => console.error(err));

            // 5. Actualizar el estado de la cotización en Redis a 'en proceso' y extender TTL a 10 min
            quoteData.status = 'en proceso';
            const ttl = await this._redis.ttl(userQueueKey);
            if (ttl > 0) {
                await this._redis.set(userQueueKey, JSON.stringify(quoteData), 'EX', ttl);
            }

            // Emitir seat_sold_final a las salas correspondientes
            if (hasTickets) {
                const uniqueBookings = [...new Set(tickets.map((t: any) => t.booking))];
                for (const bookingId of uniqueBookings) {
                    RealtimeService.emitToRoom(`booking_${bookingId}`, 'seat_sold_final', {
                        seats: tickets.filter((t: any) => t.booking === bookingId).map((t: any) => t.seat),
                    });
                }
            }

            return {
                order_id: createdOrder.id,
                subtotal_base_currency: createdOrder.subtotal_base_currency,
                total_amount_base_currency: createdOrder.total_amount_base_currency,
            };
        } catch (error) {
            quoteData.status = 'pending';
            const currentTtl = await this._redis.ttl(userQueueKey);
            if (currentTtl > 0) {
                await this._redis.set(userQueueKey, JSON.stringify(quoteData), 'EX', currentTtl);
            }
            throw error;
        }
    }

    async registerPayment(body: any, session: any) {
        const { order_id, payment_method, amount, currency, reference_number } = body;

        let orderData: any = null;

        await this._orders.transaction(async (transaction: Transaction) => {
            // Lock the order first without relations to avoid PostgreSQL FOR UPDATE on LEFT JOIN errors
            const lockedOrder = await this._orders.getOne(
                { id: order_id },
                {
                    transaction,
                    lock: transaction.LOCK.UPDATE,
                },
            );
            if (!lockedOrder) throw new NotFoundError('Orden no encontrada');
            if (lockedOrder.order_status !== 1) throw new BadRequestError('La orden no admite pagos en este momento');

            // Then fetch the order with all necessary relations
            const order = await this._orders.getOne(
                { id: order_id },
                {
                    transaction,
                    relations: [
                        { association: '_Cinemas', required: false },
                        {
                            association: '_OrderLines',
                            required: false,
                            nested: [
                                { association: '_Products', required: false },
                                { association: '_Combos', required: false },
                            ],
                        },
                        {
                            association: '_Tickets',
                            required: false,
                            nested: [
                                {
                                    association: '_RoomBookings',
                                    required: false,
                                    nested: [
                                        { association: '_Movies', required: false },
                                        { association: '_Rooms', required: false },
                                    ],
                                },
                                { association: '_Seats', required: false },
                            ],
                        },
                    ],
                },
            );

            // Calculate amount in base currency using exchange rates
            let exchangeRateValue = 1;
            let quotedExchangeRateId = 1;

            if (currency) {
                const rateDb = await this._exchangeRates.getOne({ currency }, { transaction });
                if (rateDb) {
                    exchangeRateValue = Number(rateDb.rate);
                    quotedExchangeRateId = rateDb.id;
                }
            }

            const amountBase = amount * exchangeRateValue;

            // Create payment
            await this._orderPayments.create(
                {
                    order: order_id,
                    payment_method,
                    amount: amountBase,
                    quoted_exchange_rate: quotedExchangeRateId,
                    reference_number,
                    is_approved: true,
                },
                { transaction },
            );

            // Verify if total is paid
            const payments = await this._orderPayments.getAll(
                { count: false, operation: { transaction } },
                { order: order_id },
            );
            const totalPaid = payments.reduce((acc: number, p: any) => acc + Number(p.amount), 0);

            if (totalPaid >= Number(order.total_amount_base_currency)) {
                // Generación y Expiración Dinámica del JWT (Regla 4)
                const secret = AppConfig.load().security.jwtCommonSecret;
                const tickets = (order as any)._Tickets || [];
                const concessions = (order as any)._OrderLines || [];

                const hasTickets = tickets && tickets.length > 0;
                const hasConcessions = concessions && concessions.length > 0;

                let t_exp: number | null = null;
                let c_exp: number | null = null;
                let expiresInSeconds = 86400; // 24 horas por defecto

                if (hasTickets) {
                    const ticketData = tickets[0];
                    const endTime = ticketData?._RoomBookings?.end_time || new Date(Date.now() + 7200000);
                    t_exp = Math.floor(new Date(endTime).getTime() / 1000);
                    expiresInSeconds = Math.max(t_exp - Math.floor(Date.now() / 1000), 0);
                }

                if (hasConcessions) {
                    const endOfDay = new Date();
                    endOfDay.setHours(23, 59, 59, 999);
                    c_exp = Math.floor(endOfDay.getTime() / 1000);
                    expiresInSeconds = Math.max(expiresInSeconds, Math.max(c_exp - Math.floor(Date.now() / 1000), 0));
                }

                const cinemaName = (order as any)._Cinemas?.name || 'Cine Central';
                let bkg: any = undefined;

                if (hasTickets) {
                    const firstTicket = tickets[0];
                    const roomBooking = firstTicket._RoomBookings;
                    let dateFormatted = '';
                    if (roomBooking?.start_time) {
                        const d = new Date(roomBooking.start_time);
                        dateFormatted =
                            d.getFullYear() +
                            '-' +
                            String(d.getMonth() + 1).padStart(2, '0') +
                            '-' +
                            String(d.getDate()).padStart(2, '0') +
                            ' ' +
                            String(d.getHours()).padStart(2, '0') +
                            ':' +
                            String(d.getMinutes()).padStart(2, '0');
                    }
                    bkg = {
                        title: roomBooking?._Movies?.title || roomBooking?.name || 'Evento',
                        room: roomBooking?._Rooms?.name || 'Sala',
                        date: dateFormatted,
                        sts: tickets.map(
                            (t: any) => `${t._Seats?.row_identifier || ''}-${t._Seats?.column_number || ''}`,
                        ),
                    };
                }

                let cnc: any[] | undefined = undefined;
                if (hasConcessions) {
                    cnc = concessions.map((c: any) => ({
                        n: c.line_type === 1 ? c._Products?.name : c._Combos?.name,
                        q: c.quantity,
                    }));
                }

                const payload: any = {
                    sub: order_id,
                    cin: cinemaName,
                };
                if (bkg) payload.bkg = bkg;
                if (cnc) payload.cnc = cnc;

                if (t_exp) payload.t_exp = t_exp;
                if (c_exp) payload.c_exp = c_exp;

                const qrCode = JWTUtil.generateToken(payload, secret, expiresInSeconds);

                await this._orders.update({ id: order_id }, { order_status: 2, qr_code: qrCode }, { transaction }); // PAID

                // Descontar stock físicamente para cada línea de confitería
                if (hasConcessions) {
                    // operation_type 4 = 'Salida de Inventario (Venta)' (seed-core-catalogs.js)
                    const SALE_OPERATION_TYPE = 4;
                    for (const line of concessions) {
                        const productId = line.product || line._Products?.id;
                        if (!productId) continue;
                        const inv = await this._inventories.getOne(
                            { cinema: order.cinema, product: productId, deleted_at: null },
                            { transaction, lock: transaction.LOCK.UPDATE },
                        );
                        if (!inv) continue;
                        const qty = Number(line.quantity) || 0;
                        const newStock = Number(inv.stock) - qty;
                        if (newStock < 0) {
                            throw new ConflictError(
                                `Stock insuficiente para el producto ${productId}`,
                                'INSUFFICIENT_STOCK',
                            );
                        }
                        await this._inventories.update(inv.id, { stock: newStock }, { transaction });
                        await this._inventoryMovements.create(
                            {
                                inventory: inv.id,
                                operation_type: SALE_OPERATION_TYPE,
                                quantity: qty,
                                unit_cost: Number(inv.current_unit_cost_base_currency ?? 0),
                                currency: 1, // moneda base
                                user: session.userId,
                                resulting_stock: newStock,
                                resulting_unit_cost_base_currency: Number(inv.current_unit_cost_base_currency ?? 0),
                                remarks: `Venta en orden #${order_id}`,
                            },
                            { transaction },
                        );
                    }
                }

                // Registrar puntos de lealtad ganados en loyalty_ledgers
                if (order.customer && Number(order.generated_points) > 0) {
                    // operation_type 1 = 'Suma de Puntos (Compra)' (seed-core-catalogs.js)
                    const POINTS_EARN_OPERATION_TYPE = 1;
                    // Obtener balance actual del cliente
                    const customer = await this._customers.getById(order.customer, {
                        attributes: ['id', 'level_progress_points'],
                        transaction,
                    });
                    const currentPoints = Number(customer?.level_progress_points ?? 0);
                    const earnedPoints = Number(order.generated_points);
                    const newBalance = currentPoints + earnedPoints;

                    await this._loyaltyLedgers.create(
                        {
                            customer: order.customer,
                            order: order_id,
                            operation_type: POINTS_EARN_OPERATION_TYPE,
                            points: earnedPoints,
                            points_balance: newBalance,
                            remarks: `Puntos ganados por compra en orden #${order_id}`,
                        },
                        { transaction },
                    );
                    await this._customers.update(
                        order.customer,
                        { level_progress_points: newBalance },
                        { transaction },
                    );
                }

                orderData = { ...order, qr_code: qrCode, order_status: 2 };
            }
        });

        if (orderData && orderData.order_status === 2) {
            // Liberar la sesión del usuario para permitir nuevas compras
            const userQueueKey = `queue:usr:${session.userId}`;
            await this._redis.del(userQueueKey);

            RealtimeService.emitToRoom(`order_${order_id}`, 'payment_success', {
                orderId: order_id,
                qrCode: orderData.qr_code,
            });
            QueueProvider.getInstance()
                .add('order-email-queue', 'send-order-email', {
                    orderId: order_id,
                    qrCode: orderData.qr_code,
                    email: session.email,
                })
                .catch((err) => console.error(err));
        }

        return orderData;
    }

    async getOrderById(id: number) {
        return await this._orders.getById(id);
    }

    async getConcessionsByQr(qrCode: string) {
        const order = await this._orders.getOne({ qr_code: qrCode });
        if (!order) throw new NotFoundError('Invalid QR code');

        // Regla 1: Usar relations en lugar de include
        const lines = await this._orderLines.getAll(
            { count: false },
            { order: order.id },
            {
                relations: [
                    { association: '_Products', required: false },
                    { association: '_Combos', required: false },
                    { association: '_LineTypes', required: false },
                ],
            },
        );
        return { concessions: lines, concessions_used: order.concessions_validated_at !== null };
    }

    async getTicketsByQr(qrCode: string) {
        const order = await this._orders.getOne({ qr_code: qrCode });
        if (!order) throw new NotFoundError('Código QR inválido');

        // Regla 1: Usar relations en lugar de include
        const tickets = await this._tickets.getAll(
            { count: false },
            { order: order.id },
            {
                relations: [
                    { association: '_Seats', required: false },
                    { association: '_RoomBookings', required: false },
                ],
            },
        );
        return { tickets, tickets_used: order.tickets_validated_at !== null };
    }

    async validateQr(qrCode: string, body: any, session: any) {
        const { validation_type } = body; // 1 = CONCESSIONS, 2 = TICKETS

        // Regla 5: Validación Condicional Estricta
        const secret = AppConfig.load().security.jwtCommonSecret;
        let payload: any;
        try {
            payload = JWTUtil.verifyToken(qrCode, secret);
        } catch (error) {
            throw new BadRequestError('Código QR inválido o expirado');
        }

        if (validation_type === 1) {
            if (!payload.c_exp || Math.floor(Date.now() / 1000) > payload.c_exp) {
                throw new BadRequestError('Código QR de confetería expirado o inválido');
            }
        } else if (validation_type === 2) {
            if (!payload.t_exp || Math.floor(Date.now() / 1000) > payload.t_exp) {
                throw new BadRequestError('Código QR de boletos expirado o inválido');
            }
        }

        const order = await this._orders.getOne({ qr_code: qrCode });
        if (!order) throw new NotFoundError('Código QR inválido');

        if (validation_type === 1) {
            if (order.concessions_validated_at) throw new ConflictError('Confitería ya validada');
            await this._orders.update({ id: order.id }, { concessions_validated_at: new Date() });
        } else if (validation_type === 2) {
            if (order.tickets_validated_at) throw new ConflictError('Boletos ya validados');
            await this._orders.update({ id: order.id }, { tickets_validated_at: new Date() });
        } else {
            throw new ValidationError('Invalid validation type', []);
        }

        return { success: true };
    }

    async handleQuoteExpiration(queueId: string, userId: number) {
        RealtimeService.emitToRoom(`queue_${queueId}`, 'quote_expired', { queueId });
    }

    async handleSeatExpiration(showtimeId: number, seatId: number, queueId: string) {
        RealtimeService.emitToRoom(`showtime_${showtimeId}`, 'seat_unlocked', { seatId, showtimeId });
        if (queueId) RealtimeService.emitToRoom(`queue_${queueId}`, 'seat_lock_expired', { seatId, showtimeId });
    }

    async expirePendingOrder(orderId: number, queueId: string) {
        await this._orders.transaction(async (transaction: Transaction) => {
            const order = await this._orders.getOne({ id: orderId }, { transaction, lock: transaction.LOCK.UPDATE });

            if (order && order.order_status === 1) {
                await this._orders.update({ id: orderId }, { order_status: 3 }, { transaction }); // Cancelado
                await this._tickets.delete({ order: orderId }, { transaction });

                Logger.info(` Orden ${orderId} expiró y fue cancelada.`);
                RealtimeService.emitToRoom(`queue_${queueId}`, 'order_expired', { orderId });
            }
        });
    }

    async lockSeat(bookingId: number, seatId: number, userId: number, socketId?: string) {
        const lockKey = `lock:booking:${bookingId}:seat:${seatId}`;
        const success = await this._redis.set(lockKey, String(userId), 'EX', 480, 'NX');

        if (!success) throw new ConflictError('El asiento ya se encuentra bloqueado por otro usuario.');

        if (socketId) RealtimeService.emitToSocket(socketId, 'seat_lock_success', { bookingId, seatId });

        RealtimeService.emitToRoom(`booking_${bookingId}`, 'seat_locked_by_other', { bookingId, seatId });

        return true;
    }

    async unlockSeat(bookingId: number, seatId: number, userId: number) {
        const lockKey = `lock:booking:${bookingId}:seat:${seatId}`;
        const lockedUserId = await this._redis.get(lockKey);

        if (lockedUserId === String(userId)) {
            await this._redis.del(lockKey);
            RealtimeService.emitToRoom(`booking_${bookingId}`, 'seat_unlocked', { bookingId, seatId });
            return true;
        }

        return false;
    }
}
