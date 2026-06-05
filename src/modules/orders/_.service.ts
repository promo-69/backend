import { BaseService } from '@bases/service.base.js';
import { Database, Ops } from '@database/index.js';
import { CacheDatabaseProvider } from '@providers/cache-database.provider.js';
import { QueueProvider } from '@providers/queue.provider.js';
import { RealtimeProvider } from '@providers/realtime.provider.js';
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

export enum LineType {
	PRODUCT = 1,
	COMBO = 2,
}
export enum OrderStatus {
	PENDING = 1,
	PAID = 2,
	CANCELLED = 3,
	COMPLETED = 4,
}
export enum OrderState {
	PENDING = 'pending',
	PAYMENT_PENDING = 'payment_pending',
	PROCESSING = 'processing',
}

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
	private get _customers() {
		return Database.repository('main', 'customers') as any;
	}
	private get _loyaltyLedgers() {
		return Database.repository('main', 'loyalty-ledgers') as any;
	}
	private get _cinemas() {
		return Database.repository('main', 'cinemas') as any;
	}
	/**
	 * Crea una cotizacion temporal para iniciar el proceso de compra.
	 * Bloquea al usuario para tener una sola sesion activa.
	 */
	async createQuote(body: { cinema: number }, session: any) {
		const { cinema } = body;
		if (!cinema) throw new ValidationError('La sucursal es requerida', []);

		// Verifica si el usuario ya tiene una sesion de compra activa
		const userQueueKey = `queue:usr:${session.userId}`;
		const existingQuote = await this._redis.get(userQueueKey);

		if (existingQuote)
			throw new ConflictError('Ya tienes una sesión activa');

		const cinemaData = await this._cinemas.count({ id: cinema });
		if (!cinemaData) throw new NotFoundError('La sucursal no existe.');

		// Obtiene las tasas de cambio de monedas disponibles
		const allRates = await this._exchangeRates.getAll({ count: false, order: [['id', 'DESC']] });
		const exchangeRatesDict: Record<number, any> = {};
		for (const rate of allRates) if (!exchangeRatesDict[rate.currency]) exchangeRatesDict[rate.currency] = rate;

		const baseCurrency = await (Database.repository('main', 'currencies') as any).getOne({
			is_base_currency: true,
		});
		const systemBaseCurrencyId = baseCurrency ? baseCurrency.id : 1;

		// Establece el tiempo de vida de la cotizacion en 10 minutos
		const TTL_SECONDS = 600;
		const createdAt = new Date();
		const expiresAt = new Date(createdAt.getTime() + TTL_SECONDS * 1000);

		const queueId = randomUUID();
		const quoteData = {
			queue_id: queueId,
			status: OrderState.PENDING,
			cinema,
			system_base_currency: systemBaseCurrencyId,
			exchange_rates: exchangeRatesDict,
			created_at: createdAt.toISOString(),
			expires_at: expiresAt.toISOString(),
		};

		// Guarda la cotizacion en Redis usando el ID del usuario
		await this._redis.set(userQueueKey, JSON.stringify(quoteData), 'EX', TTL_SECONDS);

		// Devuelve los datos de la cotizacion creada
		return {
			queue_id: queueId,
			cinema,
			expires_in: TTL_SECONDS,
			created_at: quoteData.created_at,
			expires_at: quoteData.expires_at,
		};
	}

	/**
	 * Consulta el estado actual de la sesion de compra activa.
	 * Retorna la informacion de tiempo restante, sucursal y estado.
	 */
	async getShoppingSessionState(session: any) {
		const userQueueKey = `queue:usr:${session.userId}`;
		const quoteRaw = await this._redis.get(userQueueKey);

		if (!quoteRaw) {
			throw new NotFoundError('No existe una sesión de compra activa.');
		}

		const currentTtl = await this._redis.ttl(userQueueKey);
		const quoteData = JSON.parse(quoteRaw);

		return {
			queue_id: quoteData.queue_id,
			cinema: quoteData.cinema,
			status: quoteData.status,
			created_at: quoteData.created_at,
			expires_at: quoteData.expires_at,
			expires_in: currentTtl,
		};
	}

	/**
	 * Obtiene el detalle de la cotización/sesión de compra activa,
	 * incluyendo las relaciones de orden si ya fue creada.
	 */
	async getShoppingSessionDetails(session: any) {
		const sessionState = await this.getShoppingSessionState(session);
		const customerId = Number(session.customerId);

		// Busca si ya existe una orden pendiente asociada al cliente
		const pendingOrder = await this._orders.getOne(
			{ customer: customerId, cinema: sessionState.cinema, order_status: 1 },
			{
				relations: [
					{
						association: '_Tickets',
						required: false,
						nested: [{ association: '_Seats' }, { association: '_RoomBookings' }],
					},
					{
						association: '_OrderLines',
						required: false,
						nested: [{ association: '_Products' }, { association: '_Combos' }],
					},
					{
						association: '_OrderTaxes',
						required: false,
						nested: [{ association: '_Taxes' }],
					},
				],
			},
		);

		return {
			session: sessionState,
			order: pendingOrder || null,
		};
	}

	/**
	 * Procesa los elementos de la compra confirmando inventarios y precios.
	 * Registra la orden en la base de datos de manera transaccional.
	 */
	async processCheckout(body: any, session: any) {
		const { queue_id, concessions = [], tickets = [] } = body;
		if (!queue_id) throw new ValidationError('La sesión de compra es requerida', []);

		// Recupera y valida la sesion de compra activa
		const userQueueKey = `queue:usr:${session.userId}`;
		const quoteRaw = await this._redis.get(userQueueKey);
		if (!quoteRaw) throw new BadRequestError('La sesión de compra ha expirado o no existe.');

		const quoteData = JSON.parse(quoteRaw);
		if (quoteData.queue_id !== queue_id)
			throw new ForbiddenError('El identificador de la sesión de compra es inválido.');
		if (quoteData.status != OrderState.PENDING)
			throw new ConflictError('La cotización no está disponible para ser procesada.');

		// Marca la sesion como en proceso para evitar conflictos concurrentes
		quoteData.status = OrderState.PROCESSING;
		const currentTtl = await this._redis.ttl(userQueueKey);
		if (currentTtl <= 0) throw new ConflictError('La sesión de compra ha expirado o no existe.');
		await this._redis.set(userQueueKey, JSON.stringify(quoteData), 'EX', currentTtl);

		try {
			const hasConcessions = concessions && concessions.length > 0;
			const hasTickets = tickets.length > 0;
			if (!hasTickets && !hasConcessions) throw new ValidationError('El carrito está completamente vacío.', []);

			// Valida que los asientos sigan bloqueados por el usuario
			if (hasTickets) {
				for (const ticket of tickets) {
					const lockKey = `lock:booking:${ticket.booking}:seat:${ticket.seat}`;
					const lockedUserId = await this._redis.get(lockKey);
					if (!lockedUserId || lockedUserId !== String(session.userId))
						throw new ConflictError(
							'Uno de los asientos seleccionados ya no está disponible o expiró su tiempo de reserva',
						);
				}
			}

			let createdOrder: any;
			// Inicia una transaccion en base de datos para crear la orden
			await this._orders.transaction(async (transaction: Transaction) => {
				// Verifica disponibilidad en inventario antes de continuar
				if (hasConcessions)
					await this._checkInventoryForConcessions(concessions, quoteData.cinema, transaction);

				let subtotalBase = 0;
				let taxesBase = 0;
				const exchangeRatesDict = quoteData.exchange_rates || {};
				const orderTaxesCollector: Record<number, { rate: number; amount: number }> = {};

				// Carga modificadores de precio y reglas de impuestos activas para la sucursal
				const activeModifiers = await this._priceModifiers.getAll(
					{ count: false, operation: { transaction } },
					{ cinema: [quoteData.cinema, null] },
				);
				const activeTaxes = await this._taxRules.getAll(
					{ count: false, relations: [{ association: '_Taxes' }], operation: { transaction } },
					{ cinema: [quoteData.cinema, null] },
				);

				// Extrae tipos de operacion requeridos por los modificadores
				const opTypeIds = [...new Set(activeModifiers.map((m: any) => m.operation_type))].filter(Boolean);
				const loadedOpTypes = opTypeIds.length
					? await (Database.repository('main', 'operation-types') as any).getAll(
							{ count: false, operation: { transaction } },
							{ id: opTypeIds },
						)
					: [];
				const opTypesMap = new Map<number, any>(loadedOpTypes.map((ot: any) => [ot.id, ot]));

				if (hasConcessions) {
					// Obtiene productos y combos involucrados para calcular precios base
					const productIdsForPrice =
						concessions.filter((c: any) => c.line_type === 1).map((c: any) => c.product) || [];
					const comboIdsForPrice =
						concessions.filter((c: any) => c.line_type === 2).map((c: any) => c.combo) || [];
					const loadedProducts = productIdsForPrice.length
						? await this._products.getAll(
								{ count: false, operation: { transaction } },
								{ id: productIdsForPrice },
							)
						: [];
					const loadedCombos = comboIdsForPrice.length
						? await this._combos.getAll(
								{ count: false, operation: { transaction } },
								{ id: comboIdsForPrice },
							)
						: [];

					// Crea diccionarios en memoria para acceso rapido a precios
					const productPriceMap = new Map<number, { price: number; currency: number }>(
						loadedProducts.map((p: any) => [p.id, { price: Number(p.price), currency: p.currency || 1 }]),
					);
					const comboPriceMap = new Map<number, { price: number; currency: number }>(
						loadedCombos.map((c: any) => [c.id, { price: Number(c.price), currency: c.currency || 1 }]),
					);
					const productsMap = new Map<number, any>(loadedProducts.map((p: any) => [p.id, p]));

					// Calcula precios finales, impuestos y modificadores para confiteria
					const result = await this._calculateConcessionsPrices(
						concessions,
						exchangeRatesDict,
						activeModifiers,
						activeTaxes,
						opTypesMap,
						productsMap,
						productPriceMap,
						comboPriceMap,
						orderTaxesCollector,
					);
					subtotalBase += result.subtotalBase;
					taxesBase += result.taxesBase;
				}

				if (hasTickets) {
					// Extrae identificadores unicos para minimizar consultas
					const uniqueBookingIds = [...new Set(tickets.map((t: any) => t.booking))];
					const loadedBookings = uniqueBookingIds.length
						? await (Database.repository('main', 'room-bookings') as any).getAll(
								{
									count: false,
									operation: { transaction },
									relations: [{ association: '_Showtimes' }, { association: '_Rooms' }],
								},
								{ id: uniqueBookingIds },
							)
						: [];
					const bookingsMap = new Map<number, any>(loadedBookings.map((b: any) => [b.id, b]));

					const uniqueSeatIds = [...new Set(tickets.map((t: any) => t.seat))];
					const loadedSeats = uniqueSeatIds.length
						? await (Database.repository('main', 'seats') as any).getAll(
								{ count: false, operation: { transaction } },
								{ id: uniqueSeatIds },
							)
						: [];
					const seatsMap = new Map<number, any>(loadedSeats.map((s: any) => [s.id, s]));

					// Calcula precios finales, impuestos y modificadores para boletos
					const result = await this._calculateTicketsPrices(
						tickets,
						exchangeRatesDict,
						activeModifiers,
						activeTaxes,
						opTypesMap,
						bookingsMap,
						seatsMap,
						orderTaxesCollector,
					);
					subtotalBase += result.subtotalBase;
					taxesBase += result.taxesBase;
				}

				// Totaliza los montos y crea la cabecera de la orden
				const totalBase = subtotalBase + taxesBase;
				const customerId = Number(session.customerId);
				createdOrder = await this._orders.create(
					{
						customer: customerId,
						cinema: quoteData.cinema,
						system_base_currency: quoteData.system_base_currency || 1,
						subtotal_base_currency: subtotalBase,
						tax_amount_base_currency: taxesBase,
						total_amount_base_currency: totalBase,
						generated_points: Math.floor(totalBase),
						order_status: 1,
					},
					{ transaction },
				);

				// Inserta los impuestos consolidados y los elementos comprados
				const taxesToInsert = Object.keys(orderTaxesCollector).map((taxId) => ({
					order: createdOrder.id,
					tax: Number(taxId),
					applied_rate: orderTaxesCollector[Number(taxId)].rate,
					tax_amount_base_currency: orderTaxesCollector[Number(taxId)].amount,
				}));
				if (taxesToInsert.length > 0) await this._orderTaxes.bulkCreate(taxesToInsert, { transaction });

				if (hasConcessions) await this._persistConcessions(createdOrder.id, concessions, transaction);
				if (hasTickets) await this._persistTickets(createdOrder.id, tickets, transaction);

				return createdOrder;
			});

			// Restaura el estado de la cotizacion para permitir el pago
			quoteData.status = OrderState.PAYMENT_PENDING;
			quoteData.order_id = createdOrder.id;
			await this._redis.set(userQueueKey, JSON.stringify(quoteData), 'EX', 600);

			// Agrega tarea en cola para expirar la orden despues de 10 minutos
			QueueProvider.getInstance()
				.add(
					'order-expiration-queue',
					'expire-pending-order',
					{ orderId: createdOrder.id, queueId: queue_id },
					{ delay: 600_000 },
				)
				.catch((err) => console.error(err));

			return {
				order_id: createdOrder.id,
				subtotal_base_currency: createdOrder.subtotal_base_currency,
				total_amount_base_currency: createdOrder.total_amount_base_currency,
			};
		} catch (error) {
			// Revierte estado en caso de error para permitir reintentos
			quoteData.status = OrderState.PENDING;
			const currentTtl = await this._redis.ttl(userQueueKey);
			if (currentTtl <= 0) throw new ConflictError('La sesión de compra ha expirado o no existe.');
			await this._redis.set(userQueueKey, JSON.stringify(quoteData), 'EX', currentTtl);
			throw error;
		}
	}

	/**
	 * Registra el pago de una orden y finaliza el proceso de compra.
	 * Genera los codigos QR y notifica al cliente cuando el pago esta completo.
	 */
	async registerPayment(body: any, session: any) {
		const { payment_method, amount, currency, reference_number } = body;
		let orderData: any = null;
		let remaining_balance: number | null = null;
		const userQueueKey = `queue:usr:${session.userId}`;

		// Valida que la sesion de compra siga vigente
		const quoteRaw = await this._redis.get(userQueueKey);
		if (!quoteRaw) throw new BadRequestError('El tiempo para pagar ha expirado o no existe sesión de compra.');
		const quoteData = JSON.parse(quoteRaw);
		
		const order_id = quoteData.order_id;
		if (!order_id) throw new ForbiddenError('No hay una orden asociada a esta sesión de compra.');

		const exchangeRatesDict = quoteData.exchange_rates || {};

		// Inicia transaccion para registrar el pago con seguridad
		await this._orders.transaction(async (transaction: Transaction) => {
			const lockedOrder = await this._orders.getOne(
				{ id: order_id },
				{ transaction, lock: transaction.LOCK.UPDATE },
			);
			if (!lockedOrder) throw new NotFoundError('Orden no encontrada');
			if (lockedOrder.order_status !== 1) throw new BadRequestError('La orden no admite pagos en este momento');
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
										{ association: '_Showtimes', required: false },
										{ association: '_RentalRequests', required: false },
										{ association: '_RoomEvents', required: false },
									],
								},
								{ association: '_Seats', required: false },
							],
						},
					],
				},
			);
			let exchangeRateValue = 1;
			let quotedExchangeRateId = 1;
			if (currency) {
				const rateDb = exchangeRatesDict[currency];
				if (rateDb) {
					exchangeRateValue = Number(rateDb.rate);
					quotedExchangeRateId = rateDb.id;
				}
			}
			const amountBase = amount * exchangeRateValue;

			// Ramificación según método de pago
			if (payment_method === 'points' || payment_method === 'cinepuntos') {
				const ledgers = await this._loyaltyLedgers.getAll(
					{ count: false, order: [['id', 'DESC']], limit: 1, operation: { transaction } },
					{ customer: session.customerId }
				);
				const currentBalance = ledgers.length > 0 ? Number(ledgers[0].points_balance) : 0;
				if (amount > currentBalance) {
					throw new BadRequestError('Saldo de puntos insuficiente');
				}
				// Descontar puntos de una vez con un registro negativo
				await this._loyaltyLedgers.create({
					customer: session.customerId,
					points: -amount,
					points_balance: currentBalance - amount,
					description: `Pago parcial de orden ${order_id}`,
				}, { transaction });
			} else if (payment_method === 'transfer' || payment_method === 'mobile_payment') {
				// TODO: Validar referencia con Simulador API
			} else if (payment_method === 'cash') {
				// El operador de taquilla ya lo validó
			}

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
			// Calcula el total pagado y verifica si cubre el monto de la orden
			const payments = await this._orderPayments.getAll(
				{ count: false, operation: { transaction } },
				{ order: order_id },
			);
			const totalPaid = payments.reduce((acc: number, p: any) => acc + Number(p.amount), 0);
			if (totalPaid >= Number(order.total_amount_base_currency)) {
				const tickets = (order as any)._Tickets || [];
				const concessions = (order as any)._OrderLines || [];

				// Genera el codigo QR para el acceso
				const qrCode = this._generateOrderQrCode(order, tickets, concessions);
				await this._orders.update({ id: order_id }, { order_status: 2, qr_code: qrCode }, { transaction });

				// Actualiza inventario y otorga puntos de lealtad
				if (concessions.length > 0)
					await this._deductPhysicalInventory(concessions, order, session.userId, transaction);
				await this._awardLoyaltyPoints(order, transaction);
				orderData = { ...order, qr_code: qrCode, order_status: 2 };
			} else {
				remaining_balance = Number(order.total_amount_base_currency) - totalPaid;
			}
		});

		// Acciones posteriores si la orden fue pagada completamente
		if (orderData && orderData.order_status === 2) {
			await this._redis.del(userQueueKey);
			RealtimeProvider.getInstance().emitToRoom(`order_${order_id}`, 'payment_success', {
				orderId: order_id,
				qrCode: orderData.qr_code,
			});

			// Emite eventos de tiempo real para confirmar asientos vendidos permanentemente
			if (orderData._Tickets && orderData._Tickets.length > 0) {
				const uniqueShowtimes = new Set<number>();
				const ticketsByShowtime = new Map<number, number[]>();

				for (const t of orderData._Tickets) {
					let showtimeId = null;
					if (t._RoomBookings && t._RoomBookings._Showtimes) {
						const st = Array.isArray(t._RoomBookings._Showtimes)
							? t._RoomBookings._Showtimes[0]
							: t._RoomBookings._Showtimes;
						showtimeId = st?.id;
					}
					if (showtimeId) {
						uniqueShowtimes.add(showtimeId);
						if (!ticketsByShowtime.has(showtimeId)) ticketsByShowtime.set(showtimeId, []);
						ticketsByShowtime.get(showtimeId)!.push(t.seat);
					}
				}

				for (const showtimeId of uniqueShowtimes) {
					const seatIds = ticketsByShowtime.get(showtimeId)!;

					const pipeline = this._redis.pipeline();
					for (const seatId of seatIds) {
						pipeline.zrem(`showtime:${showtimeId}:locked_seats`, String(seatId));
					}
					await pipeline.exec();

					RealtimeProvider.getInstance().emitToRoom(`showtime_${showtimeId}`, 'seats_sold_final', {
						seatIds,
					});
				}
			}

			// Envia correo de confirmacion de compra
			QueueProvider.getInstance()
				.add('order-email-queue', 'send-order-email', {
					orderId: order_id,
					qrCode: orderData.qr_code,
					email: session.email,
				})
				.catch((err) => console.error(err));
		} else if (remaining_balance !== null && remaining_balance > 0) {
			return { remaining_balance, message: 'Pago parcial registrado exitosamente' };
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

	/**
	 * Valida un codigo QR para el acceso a confiteria o boletos.
	 * Verifica la firma del JWT, expiracion y previene el doble uso.
	 */
	async validateQr(qrCode: string, body: any, session: any) {
		const { validation_type } = body; // 1 = CONCESSIONS, 2 = TICKETS

		// Verifica la validez criptografica del codigo QR
		const secret = AppConfig.load().security.jwtCommonSecret;
		let payload: any;
		try {
			payload = JWTUtil.verifyToken(qrCode, secret);
		} catch (error) {
			throw new BadRequestError('Código QR inválido o expirado');
		}

		// Valida los tiempos de expiracion por tipo de articulo
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

		// Registra el uso para prevenir multiples validaciones del mismo codigo
		if (validation_type === 1) {
			if (order.concessions_validated_at) throw new ConflictError('Confitería ya validada');
			await this._orders.update({ id: order.id }, { concessions_validated_at: new Date() });
		} else if (validation_type === 2) {
			if (order.tickets_validated_at) throw new ConflictError('Boletos ya validados');
			await this._orders.update({ id: order.id }, { tickets_validated_at: new Date() });
		} else {
			throw new ValidationError('Tipo de validacion invalida', []);
		}

		return { success: true };
	}

	/**
	 * Verifica si hay stock suficiente de confiteria para una orden.
	 * Descompone combos en productos individuales y calcula el stock disponible restando reservaciones.
	 */
	private async _checkInventoryForConcessions(concessions: any[], cinema: number, transaction: Transaction) {
		const requiredProducts: Record<number, number> = {};
		const comboIds = concessions.filter((c: any) => c.line_type === 2 && c.combo).map((c: any) => c.combo);

		// Carga la definicion de los combos para conocer los productos que los componen
		let allComboParts: any[] = [];
		if (comboIds.length > 0) {
			allComboParts = await this._comboProducts.getAll(
				{ count: false, operation: { transaction } },
				{ combo: comboIds },
			);
		}

		// Consolida la cantidad total requerida por cada producto basico
		for (const item of concessions) {
			if (item.line_type === 1 && item.product) {
				requiredProducts[item.product] = (requiredProducts[item.product] || 0) + item.quantity;
			} else if (item.line_type === 2 && item.combo) {
				const comboParts = allComboParts.filter((part: any) => part.combo === item.combo);
				for (const part of comboParts) {
					requiredProducts[part.product] =
						(requiredProducts[part.product] || 0) + part.quantity * item.quantity;
				}
			}
		}
		const productIds = Object.keys(requiredProducts)
			.map(Number)
			.sort((a, b) => a - b);
		if (productIds.length > 0) {
			// Consulta el inventario fisico y lo bloquea contra actualizaciones concurrentes
			const inventories = await this._inventories.getAll(
				{
					count: false,
					order: [['product', 'ASC']],
					operation: { transaction, lock: transaction.LOCK.UPDATE },
				},
				{ cinema, product: productIds },
			);
			if (inventories.length !== productIds.length)
				throw new NotFoundError('Uno o más productos no existen en el inventario de esta sucursal.');

			// Busca ordenes pendientes de otros usuarios para reservar inventario logico
			const allPendingLines = await this._orderLines.getAll(
				{
					count: false,
					relations: [{ association: '_Orders', required: true, where: { order_status: [1] } }],
					operation: { transaction },
				},
				{ product: productIds },
			);

			// Valida que el stock disponible alcance a cubrir la cantidad solicitada
			for (const inv of inventories) {
				const requiredQty = requiredProducts[inv.product];
				const pendingLines = allPendingLines.filter((line: any) => line.product === inv.product);
				let pendingQty = 0;
				for (const line of pendingLines) pendingQty += line.quantity;
				const availableStock = inv.stock - pendingQty;
				if (availableStock < requiredQty)
					throw new ConflictError(
						`Inventario insuficiente para producto ID ${inv.product}. Disponible real: ${Math.max(0, availableStock)}`,
					);
			}
		}
	}

	private _isValidTime(m: any, currentDate: string, currentTime: string, currentDay: number) {
		if (m.target_currency_condition) return false;
		if (m.start_date && m.start_date > currentDate) return false;
		if (m.end_date && m.end_date < currentDate) return false;
		if (m.start_time && m.start_time > currentTime) return false;
		if (m.end_time && m.end_time <= currentTime) return false;
		if (m.week_day && m.week_day !== currentDay) return false;
		return true;
	}

	/**
	 * Calcula los precios para confiteria incluyendo modificadores, tipo de cambio e impuestos.
	 * Registra el subtotal y acumula los impuestos en el colector global de la orden.
	 */
	private async _calculateConcessionsPrices(
		concessions: any[],
		exchangeRatesDict: any,
		activeModifiers: any[],
		activeTaxes: any[],
		opTypesMap: Map<number, any>,
		productsMap: Map<number, any>,
		productPriceMap: Map<number, any>,
		comboPriceMap: Map<number, any>,
		orderTaxesCollector: Record<number, any>,
	) {
		const now = new Date();
		const currentDate = now.toISOString().split('T')[0];
		const currentTime = now.toTimeString().split(' ')[0];
		const currentDay = now.getDay() === 0 ? 7 : now.getDay();
		let subtotalBase = 0;
		let taxesBase = 0;

		for (const item of concessions) {
			// Determina precio en moneda original y lo convierte a moneda base
			const priceData =
				item.line_type === 1
					? productPriceMap.get(item.product) || { price: 0, currency: 1 }
					: comboPriceMap.get(item.combo) || { price: 0, currency: 1 };
			const rateObj = exchangeRatesDict[priceData.currency] || { rate: 1, id: 1 };
			const basePrice = priceData.price * Number(rateObj.rate);
			item.exchangeRateId = rateObj.id;
			let finalUnitPrice = basePrice;
			const productData = item.product ? productsMap.get(item.product) : null;

			// Aplica modificadores especificos para confiteria filtrando por hora y alcance
			const modifiers = activeModifiers.filter((m: any) => {
				if (m.modifier_scope !== 2) return false;
				if (!this._isValidTime(m, currentDate, currentTime, currentDay)) return false;
				if (m.line_type && m.line_type !== item.line_type) return false;
				if (m.product_category && productData && m.product_category !== productData.product_category)
					return false;
				if (m.product && m.product !== item.product) return false;
				if (m.combo && m.combo !== item.combo) return false;
				return true;
			});
			item.appliedModifiers = [];
			for (const mod of modifiers) {
				const opType = opTypesMap.get(mod.operation_type) || ({} as any);
				let modValue = 0;
				if (mod.is_percentage) {
					modValue = basePrice * (Number(mod.value) / 100);
				} else {
					const modCurr = mod.currency || 1;
					const modRate = exchangeRatesDict[modCurr] ? Number(exchangeRatesDict[modCurr].rate) : 1;
					modValue = Number(mod.value) * modRate;
				}
				const netChange = opType.is_increment ? modValue : -modValue;
				finalUnitPrice += netChange;
				item.appliedModifiers.push({
					price_modifier: mod.id,
					applied_amount_base_currency: netChange * item.quantity,
				});
			}

			// El precio final no puede ser negativo
			finalUnitPrice = Math.max(0, finalUnitPrice);
			subtotalBase += finalUnitPrice * item.quantity;

			// Aplica reglas de impuestos vigentes basadas en la categoria de producto
			const itemTaxes = activeTaxes.filter(
				(t: any) =>
					t.tax_scope === 2 &&
					(t.product === item.product || t.combo === item.combo || t.product === null) &&
					(t.product_category === null ||
						(productData && t.product_category === productData.product_category)) &&
					(t.line_type === null || t.line_type === item.line_type),
			);
			for (const rule of itemTaxes) {
				const taxRate = Number(rule._Taxes?.rate ?? 0);
				const taxAmount = finalUnitPrice * item.quantity * (taxRate / 100);
				taxesBase += taxAmount;
				if (!orderTaxesCollector[rule.tax]) orderTaxesCollector[rule.tax] = { rate: taxRate, amount: 0 };
				orderTaxesCollector[rule.tax].amount += taxAmount;
			}
			item.originalPrice = basePrice;
			item.finalPrice = finalUnitPrice;
		}
		return { subtotalBase, taxesBase };
	}

	private async _calculateTicketsPrices(
		tickets: any[],
		exchangeRatesDict: any,
		activeModifiers: any[],
		activeTaxes: any[],
		opTypesMap: Map<number, any>,
		bookingsMap: Map<number, any>,
		seatsMap: Map<number, any>,
		orderTaxesCollector: Record<number, any>,
	) {
		const now = new Date();
		const currentDate = now.toISOString().split('T')[0];
		const currentTime = now.toTimeString().split(' ')[0];
		const currentDay = now.getDay() === 0 ? 7 : now.getDay();
		let subtotalBase = 0;
		let taxesBase = 0;
		for (const ticket of tickets) {
			const bookingDb = bookingsMap.get(ticket.booking) as any;
			const showtimeData = bookingDb
				? Array.isArray(bookingDb._Showtimes)
					? bookingDb._Showtimes[0]
					: bookingDb._Showtimes
				: null;
			const seatData = seatsMap.get(ticket.seat) as any;
			const rawBasePrice = showtimeData ? Number(showtimeData.price || 0) : 0;
			const currency = showtimeData ? showtimeData.currency || 1 : 1;
			const rateObj = exchangeRatesDict[currency] || { rate: 1, id: 1 };
			const basePrice = rawBasePrice * Number(rateObj.rate);
			ticket.exchangeRateId = rateObj.id;
			let finalUnitPrice = basePrice;
			const modifiers = activeModifiers.filter((m: any) => {
				if (m.modifier_scope !== 1) return false;
				if (!this._isValidTime(m, currentDate, currentTime, currentDay)) return false;
				if (m.booking_type && bookingDb && m.booking_type !== bookingDb.booking_type) return false;
				if (m.movie && showtimeData && m.movie !== showtimeData.movie) return false;
				if (m.projection_type && showtimeData && m.projection_type !== showtimeData.projection_type)
					return false;
				if (m.seat_category && seatData && m.seat_category !== seatData.seat_category) return false;
				if (m.room_type && bookingDb?._Rooms && m.room_type !== bookingDb._Rooms.room_type) return false;
				return true;
			});
			ticket.appliedModifiers = [];
			for (const mod of modifiers) {
				const opType = opTypesMap.get(mod.operation_type) || ({} as any);
				let modValue = 0;
				if (mod.is_percentage) {
					modValue = basePrice * (Number(mod.value) / 100);
				} else {
					const modCurr = mod.currency || 1;
					const modRate = exchangeRatesDict[modCurr] ? Number(exchangeRatesDict[modCurr].rate) : 1;
					modValue = Number(mod.value) * modRate;
				}
				const netChange = opType.is_increment ? modValue : -modValue;
				finalUnitPrice += netChange;
				ticket.appliedModifiers.push({ price_modifier: mod.id, applied_amount_base_currency: netChange });
			}
			finalUnitPrice = Math.max(0, finalUnitPrice);
			subtotalBase += finalUnitPrice;
			const ticketTaxes = activeTaxes.filter((t: any) => t.tax_scope === 1);
			for (const rule of ticketTaxes) {
				const ticketTaxRate = Number(rule._Taxes?.rate ?? 0);
				const taxAmount = finalUnitPrice * (ticketTaxRate / 100);
				taxesBase += taxAmount;
				if (!orderTaxesCollector[rule.tax]) orderTaxesCollector[rule.tax] = { rate: ticketTaxRate, amount: 0 };
				orderTaxesCollector[rule.tax].amount += taxAmount;
			}
			ticket.originalPrice = basePrice;
			ticket.finalPrice = finalUnitPrice;
		}
		return { subtotalBase, taxesBase };
	}

	private async _persistConcessions(orderId: number, concessions: any[], transaction: Transaction) {
		const linesToInsert = concessions.map((concession: any) => ({
			order: orderId,
			line_type: concession.line_type,
			product: concession.product || null,
			combo: concession.combo || null,
			quantity: concession.quantity,
			original_unit_price: concession.originalPrice,
			unit_price: concession.finalPrice,
			quoted_exchange_rate: concession.exchangeRateId,
		}));
		const createdLines = await this._orderLines.bulkCreate(linesToInsert, { transaction });
		const modifiersToInsert: any[] = [];
		for (let i = 0; i < concessions.length; i++) {
			const concession = concessions[i];
			const createdLine = createdLines[i];
			if (concession.appliedModifiers && concession.appliedModifiers.length > 0) {
				for (const mod of concession.appliedModifiers) {
					modifiersToInsert.push({
						order_line: createdLine.id,
						price_modifier: mod.price_modifier,
						applied_amount_base_currency: mod.applied_amount_base_currency,
					});
				}
			}
		}
		if (modifiersToInsert.length > 0)
			await this._appliedPriceModifiers.bulkCreate(modifiersToInsert, { transaction });
	}

	private async _persistTickets(orderId: number, tickets: any[], transaction: Transaction) {
		const ticketsToInsert = tickets.map((ticket: any) => ({
			order: orderId,
			booking: ticket.booking,
			seat: ticket.seat,
			original_price: ticket.originalPrice,
			price: ticket.finalPrice,
			quoted_exchange_rate: ticket.exchangeRateId,
		}));
		const createdTickets = await this._tickets.bulkCreate(ticketsToInsert, { transaction });
		const modifiersToInsert: any[] = [];
		for (let i = 0; i < tickets.length; i++) {
			const ticket = tickets[i];
			const createdTicket = createdTickets[i];
			if (ticket.appliedModifiers && ticket.appliedModifiers.length > 0) {
				for (const mod of ticket.appliedModifiers) {
					modifiersToInsert.push({
						ticket: createdTicket.id,
						price_modifier: mod.price_modifier,
						applied_amount_base_currency: mod.applied_amount_base_currency,
					});
				}
			}
		}
		if (modifiersToInsert.length > 0)
			await this._appliedPriceModifiers.bulkCreate(modifiersToInsert, { transaction });
	}

	private async _deductPhysicalInventory(concessions: any[], order: any, userId: number, transaction: Transaction) {
		const SALE_OPERATION_TYPE = 4;
		const requiredProducts: Record<number, number> = {};
		const comboIds = concessions
			.filter((c: any) => c.line_type === 2 && (c.combo || c._Combos?.id))
			.map((c: any) => c.combo || c._Combos?.id);
		let allComboParts: any[] = [];
		if (comboIds.length > 0) {
			allComboParts = await this._comboProducts.getAll(
				{ count: false, operation: { transaction } },
				{ combo: comboIds },
			);
		}
		for (const line of concessions) {
			if (line.line_type === 1) {
				const pId = line.product || line._Products?.id;
				if (pId) requiredProducts[pId] = (requiredProducts[pId] || 0) + Number(line.quantity);
			} else if (line.line_type === 2) {
				const cId = line.combo || line._Combos?.id;
				if (cId) {
					const parts = allComboParts.filter((p: any) => p.combo === cId);
					for (const part of parts) {
						requiredProducts[part.product] =
							(requiredProducts[part.product] || 0) + part.quantity * Number(line.quantity);
					}
				}
			}
		}
		const productIdsToDeduct = Object.keys(requiredProducts)
			.map(Number)
			.sort((a, b) => a - b);
		for (const productId of productIdsToDeduct) {
			const inv = await this._inventories.getOne(
				{ cinema: order.cinema, product: productId, deleted_at: null },
				{ transaction, lock: transaction.LOCK.UPDATE },
			);
			if (!inv) continue;
			const qty = requiredProducts[productId];
			const newStock = Number(inv.stock) - qty;
			if (newStock < 0)
				throw new ConflictError(`Stock insuficiente para el producto ${productId}`, 'INSUFFICIENT_STOCK');
			await this._inventories.update(inv.id, { stock: newStock }, { transaction });
			const lastMovements = await this._inventoryMovements.getAll(
				{ count: false, limit: 1, order: [['id', 'DESC']], operation: { transaction } },
				{ inventory: inv.id },
			);
			const unitCost = lastMovements.length > 0 ? Number(lastMovements[0].resulting_unit_cost_base_currency) : 0;
			await this._inventoryMovements.create(
				{
					inventory: inv.id,
					operation_type: SALE_OPERATION_TYPE,
					quantity: qty,
					unit_cost: unitCost,
					currency: 1,
					user: userId,
					resulting_stock: newStock,
					resulting_unit_cost_base_currency: unitCost,
					remarks: `Venta en orden #${order.id}`,
				},
				{ transaction },
			);
		}
	}

	private async _awardLoyaltyPoints(order: any, transaction: Transaction) {
		if (order.customer && Number(order.generated_points) > 0) {
			const POINTS_EARN_OPERATION_TYPE = 1;
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
					order: order.id,
					operation_type: POINTS_EARN_OPERATION_TYPE,
					points: earnedPoints,
					points_balance: newBalance,
					remarks: `Puntos ganados por compra en orden #${order.id}`,
				},
				{ transaction },
			);
			await this._customers.update(order.customer, { level_progress_points: newBalance }, { transaction });
		}
	}

	private _generateOrderQrCode(order: any, tickets: any[], concessions: any[]): string {
		const secret = AppConfig.load().security.jwtCommonSecret;
		const hasTickets = tickets && tickets.length > 0;
		const hasConcessions = concessions && concessions.length > 0;
		let t_exp: number | null = null;
		let c_exp: number | null = null;
		let expiresInSeconds = 86400;

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
			const roomBooking = tickets[0]._RoomBookings;
			let dateFormatted = '';
			if (roomBooking?.start_time) {
				const d = new Date(roomBooking.start_time);
				dateFormatted = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
			}
			bkg = {
				title: roomBooking?._Movies?.title || roomBooking?.name || 'Evento',
				room: roomBooking?._Rooms?.name || 'Sala',
				date: dateFormatted,
				sts: tickets.map((t: any) => `${t._Seats?.row_identifier || ''}-${t._Seats?.column_number || ''}`),
			};
		}
		let cnc: any[] | undefined = undefined;
		if (hasConcessions) {
			cnc = concessions.map((c: any) => ({
				n: c.line_type === 1 ? c._Products?.name : c._Combos?.name,
				q: c.quantity,
			}));
		}
		const payload: any = { sub: order.id, cin: cinemaName };
		if (bkg) payload.bkg = bkg;
		if (cnc) payload.cnc = cnc;
		if (t_exp) payload.t_exp = t_exp;
		if (c_exp) payload.c_exp = c_exp;
		return JWTUtil.generateToken(payload, secret, expiresInSeconds);
	}
}
