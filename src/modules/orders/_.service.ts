import { BaseService } from '@bases/service.base.js';
import { Database, Ops } from '@database/index.js';
import { CacheDatabaseProvider } from '@providers/cache-database.provider.js';
import { QueueProvider } from '@providers/queue.provider.js';
import { RealtimeProvider } from '@providers/realtime.provider.js';
import { NotFoundError, ValidationError, BadRequestError, ForbiddenError, ConflictError } from '@errors/index.js';
import { Transaction } from 'sequelize';
import { JWTUtil } from '@utils/jwt.util.js';
import { MathUtil } from '@utils/math.util.js';
import { AppConfig } from '@config/app.config.js';
import { PricingService } from '@services/pricing.service.js';
import shoppingSessionService from '@services/shopping-session.service.js';
import {
	ORDER_STATUS,
	LINE_TYPE,
	PAYMENT_METHOD,
	LOYALTY_OPERATION,
	VALIDATION_TYPE,
	MODIFIER_SCOPE,
	TAX_SCOPE,
	SHOPPING_SESSION_STATUS,
	TTL_SECONDS,
	INVENTORY_OPERATION,
} from '@constants/magic-vars.constant.js';

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
	private get _paymentMethods() {
		return Database.repository('main', 'payment-methods') as any;
	}
	private get _exchangeRates() {
		return Database.repository('main', 'exchange-rates') as any;
	}
	private get _customers() {
		return Database.repository('main', 'customers') as any;
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
	private get _invoices() {
		return Database.repository('main', 'invoices') as any;
	}
	private get _invoiceSequences() {
		return Database.repository('main', 'invoice-sequences') as any;
	}
	private get _loyaltyLedgers() {
		return Database.repository('main', 'loyalty-ledgers') as any;
	}
	private get _cinemas() {
		return Database.repository('main', 'cinemas') as any;
	}
	private get _seats() {
		return Database.repository('main', 'seats') as any;
	}
	private get _currencies() {
		return Database.repository('main', 'currencies') as any;
	}
	private get _bankAccounts() {
		return Database.repository('main', 'bank-accounts') as any;
	}

	private async _getCustomerEmail(customerId: number | null, session: any): Promise<string | null> {
		if (!session.roleCode && session.email)
			return session.email;

		if (customerId) {
			const customer = await this._customers.getById(customerId, {
				relations: [{ association: '_People', nested: [{ association: '_Users' }] }],
			});

			if (customer && customer._People) {
				if (customer._People._Users) {
					const users = Array.isArray(customer._People._Users)
						? customer._People._Users
						: [customer._People._Users];
					const verifiedUser = users.find((u: any) => u.signup_verified_at !== null && !u.deleted_at);
					if (verifiedUser && verifiedUser.email) return verifiedUser.email;
				}

				if (customer._People.personal_email)
					return customer._People.personal_email;
			}
		}

		return null;
	}

	/**
	 * Crea una cotizacion temporal para iniciar el proceso de compra.
	 * Bloquea al usuario para tener una sola sesion activa.
	 */
	async createQuote(body: { cinema: number; customerId?: number }, session: any) {
		const { cinema: _cinema, customerId } = body;

		if (!_cinema && !session.cinemaId) throw new ValidationError('La sucursal es requerida', []);
		const cinema = _cinema || session.cinemaId;

		if (session.roleCode != null && !customerId)
			throw new ValidationError(
				'El ID del cliente (customerId) es requerido para crear cotizaciones desde taquilla',
				[],
			);

		if (session.roleCode == null && customerId)
			throw new ForbiddenError('No tienes permisos para comprar en nombre de otro cliente');

		const finalCustomerId = customerId || session.customerId;
		if (finalCustomerId) {
			const customerExists = await this._customers.count({ id: finalCustomerId });

			if (!customerExists) throw new NotFoundError('El ID de cliente proporcionado no existe en la base de datos.');
		}

		// Verifica si el usuario ya tiene una sesion de compra activa
		const userQueueKey = `queue:usr:${session.userId}`;
		const existingQuote = await this._redis.get(userQueueKey);

		if (existingQuote) throw new ConflictError('Ya tienes una sesión activa');

		const cinemaData = await this._cinemas.count({ id: cinema });
		if (!cinemaData) throw new NotFoundError('La sucursal no existe.');

		// Obtiene las monedas disponibles y busca únicamente la tasa más reciente de cada una
		const currencies = await this._currencies.getAll({ count: false });
		const exchangeRatesDict: Record<number, any> = {};

		// Mapeamos las monedas a un arreglo de promesas
		const ratePromises = currencies.map(async (c: any) => {
			const latestRate = await this._exchangeRates.getOne(
				{ currency: c.id },
				{ order: [['id', 'DESC']] }
			);
			return { currencyId: c.id, rate: latestRate };
		});

		// Ejecutamos todas las consultas de red simultáneamente
		const results = await Promise.all(ratePromises);

		for (const result of results)
			if (result.rate) exchangeRatesDict[result.currencyId] = result.rate;

		const baseCurrency = await this._currencies.getOne({
			is_base_currency: true,
		});
		if (!baseCurrency) throw new ConflictError('No se encontró una moneda base configurada en el sistema.');
		const systemBaseCurrencyId = baseCurrency.id;

		// Establece el tiempo de vida de la cotizacion en 10 minutos
		const createdAt = new Date();
		const expiresAt = new Date(createdAt.getTime() + TTL_SECONDS.ORDER_QUOTE * 1000);
		const sessionData = {
			cinema,
			customerId: finalCustomerId,
			created_at: createdAt.toISOString(),
			expires_at: expiresAt.toISOString(),
		};
		const quoteData = {
			...sessionData,
			status: SHOPPING_SESSION_STATUS.PENDING_ORDER,
			cinema,
			customerId: customerId || session.customerId,
			system_base_currency: systemBaseCurrencyId,
			exchange_rates: exchangeRatesDict,
		};

		// Guarda la cotizacion en Redis usando el ID del usuario
		await this._redis.set(userQueueKey, JSON.stringify(quoteData), 'EX', TTL_SECONDS.ORDER_QUOTE);

		// Devuelve los datos de la cotizacion creada
		return {
			...sessionData,
			expires_in: TTL_SECONDS.ORDER_QUOTE,
		};
	}

	/**
	 * Consulta el estado actual de la sesion de compra activa.
	 * Retorna la informacion de tiempo restante, sucursal y estado.
	 */
	async getShoppingSessionState(session: any) {
		const userQueueKey = `queue:usr:${session.userId}`;
		const quoteRaw = await this._redis.get(userQueueKey);

		if (!quoteRaw) return null;

		const currentTtl = await this._redis.ttl(userQueueKey);
		const quoteData = JSON.parse(quoteRaw);

		return {
			cinema: quoteData.cinema,
			status: quoteData.status,
			customerId: quoteData.customerId,
			created_at: quoteData.created_at,
			expires_at: quoteData.expires_at,
			expires_in: currentTtl,
			exchange_rates: quoteData.exchange_rates,
			system_base_currency: quoteData.system_base_currency,
		};
	}

	/**
	 * Obtiene el detalle de la cotización/sesión de compra activa,
	 * incluyendo las relaciones de orden si ya fue creada.
	 */
	async getShoppingSessionDetails(session: any) {
		const sessionState = await this.getShoppingSessionState(session);
		if (!sessionState) return { session: null, order: null };

		const customerId = sessionState.customerId ? Number(sessionState.customerId) : null;

		// Busca si ya existe una orden pendiente asociada al cliente
		const pendingOrder = customerId
			? await this._orders.getOne(
					{ customer: customerId, cinema: sessionState.cinema, order_status: ORDER_STATUS.PENDING },
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
				)
			: null;

		return {
			session: sessionState,
			order: pendingOrder || null,
		};
	}

	async cancelShoppingSession(session: any) {
		const { customerId, sessionFound } = await shoppingSessionService.clearSessionAndLocks(session);

		if (!sessionFound) throw new NotFoundError('No existe una sesión de compra activa.');

		if (customerId) {
			await this._orders.transaction(async (transaction: Transaction) => {
				const pendingOrders = await this._orders.getAll(
					{ count: false, operation: { transaction } },
					{ customer: customerId, order_status: ORDER_STATUS.PENDING },
				);

				for (const order of pendingOrders)
					await this._orders.update({ id: order.id }, { order_status: ORDER_STATUS.CANCELLED }, { transaction });
			});
		}

		return { message: 'Sesión de compra cancelada exitosamente y recursos devueltos.' };
	}

	/**
	 * Procesa los elementos de la compra confirmando inventarios y precios.
	 * Registra la orden en la base de datos de manera transaccional.
	 */
	async processCheckout(body: any, session: any) {
		if (body.tickets && Array.isArray(body.tickets))
			for (const ticket of body.tickets)
				if (typeof ticket.seatId !== 'number' || typeof ticket.audienceCategoryId !== 'number')
					throw new BadRequestError(
						'Cada boleto debe contener de forma válida el identificador del asiento y la categoría de la audiencia',
					);

		const { concessions = [], tickets = [] } = body;

		// Recupera y valida la sesion de compra activa
		const userQueueKey = `queue:usr:${session.userId}`;
		const quoteRaw = await this._redis.get(userQueueKey);
		if (!quoteRaw) throw new BadRequestError('La sesión de compra ha expirado o no existe.');

		const quoteData = JSON.parse(quoteRaw);
		if (quoteData.status !== SHOPPING_SESSION_STATUS.PENDING_ORDER)
			throw new ConflictError('La cotización no está disponible para ser procesada.');

		if (quoteData.is_processing) throw new ConflictError('La cotización ya está siendo procesada.');

		// Marca la sesion como en proceso para evitar conflictos concurrentes
		quoteData.is_processing = true;
		const currentTtl = await this._redis.ttl(userQueueKey);
		if (currentTtl <= 0) throw new ConflictError('La sesión de compra ha expirado o no existe.');
		await this._redis.set(userQueueKey, JSON.stringify(quoteData), 'EX', currentTtl);

		try {
			const hasConcessions = concessions && concessions.length > 0;
			const hasTickets = tickets.length > 0;
			if (!hasTickets && !hasConcessions) throw new ValidationError('El carrito está completamente vacío.', []);

			// Valida y extiende que los asientos sigan bloqueados por el usuario
			if (hasTickets) {
				const uniqueBookingIds = [...new Set(tickets.map((t: any) => t.booking))];
				const loadedBookings = uniqueBookingIds.length
					? await (Database.repository('main', 'room-bookings') as any).getAll(
							{ count: false, relations: [{ association: '_Showtimes' }] },
							{ id: uniqueBookingIds },
						)
					: [];
				const bookingsMap = new Map<number, any>(loadedBookings.map((b: any) => [b.id, b]));

				const pipeline = this._redis.pipeline();
				for (const ticket of tickets) {
					const bookingDb = bookingsMap.get(ticket.booking);
					const st = bookingDb
						? Array.isArray(bookingDb._Showtimes)
							? bookingDb._Showtimes[0]
							: bookingDb._Showtimes
						: null;
					const showtimeId = st ? st.id : null;
					if (!showtimeId) throw new NotFoundError('Showtime no encontrado para el boleto.');

					const lockKey = `lock:showtime:${showtimeId}:seat:${ticket.seatId}`;
					const lockedUserId = await this._redis.get(lockKey);
					if (!lockedUserId || lockedUserId !== String(session.userId)) {
						throw new ConflictError(
							'Uno de los asientos seleccionados ya no está disponible o expiró su tiempo de reserva',
						);
					}

					pipeline.expire(lockKey, 600);
					pipeline.zadd(
						`showtime:${showtimeId}:locked_seats`,
						'XX',
						'CH',
						Date.now() + 600000,
						String(ticket.seatId),
					);
				}
				await pipeline.exec();
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
						concessions.filter((c: any) => c.line_type === LINE_TYPE.PRODUCT).map((c: any) => c.product) || [];
					const comboIdsForPrice =
						concessions.filter((c: any) => c.line_type === LINE_TYPE.COMBO).map((c: any) => c.combo) || [];
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
						quoteData.system_base_currency,
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

					const uniqueSeatIds = [...new Set(tickets.map((t: any) => t.seatId))];
					const loadedSeats = uniqueSeatIds.length
						? await this._seats.getAll({ count: false, operation: { transaction } }, { id: uniqueSeatIds })
						: [];
					const seatsMap = new Map<number, any>(loadedSeats.map((s: any) => [s.id, s]));

					// Calcula precios finales, impuestos y modificadores para boletos
					const result = await this._calculateTicketsPrices(
						tickets,
						quoteData.cinema,
						exchangeRatesDict,
						quoteData.system_base_currency,
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
				const roundMoney = MathUtil.roundMoney;
				subtotalBase = roundMoney(subtotalBase);
				taxesBase = roundMoney(taxesBase);
				const totalBase = roundMoney(subtotalBase + taxesBase);
				const customerId = quoteData.customerId ? Number(quoteData.customerId) : null;

				createdOrder = await this._orders.create(
					{
						customer: customerId,
						cinema: quoteData.cinema,
						system_base_currency: quoteData.system_base_currency || 1,
						subtotal_base_currency: subtotalBase,
						tax_amount_base_currency: taxesBase,
						total_amount_base_currency: totalBase,
						generated_points: Math.floor(totalBase),
						order_status: ORDER_STATUS.PENDING,
					},
					{ transaction },
				);

				// Inserta los impuestos consolidados y los elementos comprados
				const taxesToInsert = Object.keys(orderTaxesCollector).map((taxId) => ({
					order: createdOrder.id,
					tax: Number(taxId),
					applied_rate: orderTaxesCollector[Number(taxId)].rate,
					tax_amount_base_currency: roundMoney(orderTaxesCollector[Number(taxId)].amount),
				}));
				if (taxesToInsert.length > 0) await this._orderTaxes.bulkCreate(taxesToInsert, { transaction });

				if (hasConcessions) await this._persistConcessions(createdOrder.id, concessions, transaction);
				if (hasTickets) await this._persistTickets(createdOrder.id, tickets, transaction);

				return createdOrder;
			});

			// Restaura el estado de la cotizacion para permitir el pago
			quoteData.status = SHOPPING_SESSION_STATUS.PENDING_PAYMENT;
			quoteData.is_processing = false;
			quoteData.order_id = createdOrder.id;
			await this._redis.set(userQueueKey, JSON.stringify(quoteData), 'EX', 600);

			// Agrega tarea en cola para expirar la orden despues de 10 minutos
			QueueProvider.getInstance()
				.add(
					'order-expiration-queue',
					'expire-pending-order',
					{ orderId: createdOrder.id, userId: session.userId },
					{ delay: 600_000 },
				)
				.catch((err) => console.error(err));

			return {
				success: true,
				subtotal_base_currency: createdOrder.subtotal_base_currency,
				total_amount_base_currency: createdOrder.total_amount_base_currency,
			};
		} catch (error) {
			// Revierte estado en caso de error para permitir reintentos
			quoteData.status = SHOPPING_SESSION_STATUS.PENDING_ORDER;
			quoteData.is_processing = false;
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
		let paymentsInput: any[] = [];

		if (Array.isArray(body)) paymentsInput = body;
		else if (body && body.payment_method && body.amount !== undefined) paymentsInput = [body];
		else throw new BadRequestError('Formato de pagos inválido');

		if (paymentsInput.length === 0) throw new BadRequestError('Debe enviar al menos un pago');

		for (const payment of paymentsInput) {
			this.validateRequired(payment, ['payment_method', 'amount', 'currency']);

			if (!['string', 'number'].includes(typeof payment.amount) || payment.amount <= 0)
				throw new BadRequestError('El monto del pago debe ser un número mayor a cero');
			if (!['string', 'number'].includes(typeof payment.currency))
				throw new BadRequestError('Debe especificar una moneda correcta');

			payment.amount = Number(payment.amount);
			payment.currency = Number(payment.currency);
		}

		const userQueueKey = `queue:usr:${session.userId}`;

		// Valida que la sesion de compra siga vigente
		const quoteRaw = await this._redis.get(userQueueKey);
		if (!quoteRaw) throw new BadRequestError('El tiempo para pagar ha expirado o no existe sesión de compra.');

		const quoteData = JSON.parse(quoteRaw);
		if (quoteData.status !== SHOPPING_SESSION_STATUS.PENDING_PAYMENT)
			throw new BadRequestError('La sesión no se encuentra en la etapa de pago o ya ha sido procesada.');

		const order_id = quoteData.order_id;
		if (!order_id) throw new ForbiddenError('No hay una orden asociada a esta sesión de compra.');

		let orderData: any = null;
		let remaining_balance: number | null = null;
		const exchangeRatesDict = quoteData.exchange_rates || {};

		// Inicia transaccion para registrar el pago con seguridad
		await this._orders.transaction(async (transaction: Transaction) => {
			const lockedOrder = await this._orders.getOne(
				{ id: order_id },
				{ transaction, lock: transaction.LOCK.UPDATE },
			);

			if (!lockedOrder) throw new NotFoundError('Orden no encontrada');

			if (lockedOrder.order_status !== ORDER_STATUS.PENDING)
				throw new BadRequestError('La orden no admite pagos en este momento');

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

			const ptsCurrency = await this._currencies.getOne({ code: 'PTS' });

			for (const payment of paymentsInput) {
				const { payment_method, amount, currency, reference_number, bank, bypass } = payment;
				const paymentMethodId = payment_method;

				let paymentCurrency = currency;
				if (paymentMethodId === PAYMENT_METHOD.LOYALTY_POINTS) {
					if (!ptsCurrency) throw new BadRequestError('La moneda de Cinepuntos (PTS) no está configurada.');
					paymentCurrency = ptsCurrency.id;
				}

				if (!paymentCurrency) paymentCurrency = quoteData.system_base_currency;

				const rateDb = exchangeRatesDict[paymentCurrency];
				if (!rateDb) throw new BadRequestError('No se encontró tasa de cambio en la cotización para esta moneda.');

				const exchangeRateValue = Number(rateDb.rate);
				const quotedExchangeRateId = rateDb.id;

				const amountBase = MathUtil.roundMoney(amount * exchangeRateValue);

				// Ramificación según método de pago
				if (paymentMethodId === PAYMENT_METHOD.LOYALTY_POINTS) {
					const loyaltyCustomerId = quoteData.customerId || session.customerId;
					if (!loyaltyCustomerId) throw new BadRequestError('No hay un cliente asociado a esta orden para usar puntos de fidelidad');

					const ledgers = await this._loyaltyLedgers.getAll(
						{ count: false, order: [['id', 'DESC']], limit: 1, operation: { transaction, lock: transaction.LOCK.UPDATE } },
						{ customer: loyaltyCustomerId },
					);

					const currentBalance = ledgers.length > 0 ? Number(ledgers[0].points_balance) : 0;
					if (amount > currentBalance) throw new BadRequestError('Saldo de puntos insuficiente');

					await this._loyaltyLedgers.create(
						{
							operation_type: LOYALTY_OPERATION.SPEND,
							customer: loyaltyCustomerId,
							points: amount,
							points_balance: currentBalance - amount,
							description: `Pago parcial de orden ${order_id}`,
						},
						{ transaction },
					);
				} else if ([PAYMENT_METHOD.POS, PAYMENT_METHOD.MOBILE_PAYMENT, PAYMENT_METHOD.BANK_TRANSFER].includes(paymentMethodId) || bypass === true) {
					if (!currency) throw new BadRequestError('La moneda es obligatoria para este método de pago');

					if (bypass !== true) {
						if (!reference_number) throw new BadRequestError('El número de referencia es obligatorio para este método de pago');
						if (!bank) throw new BadRequestError('El banco destino es obligatorio para este método de pago');

						// Obtener cuenta bancaria para validar si acepta el pago y si requiere validación con Banky
						const searchParams: any = { payment_method: paymentMethodId, currency, bank};
						const acceptedAccounts = await this._bankAccounts.getAll(
							{
								count: false,
								operation: { transaction },
								relations: [{ association: '_Banks' }]
							},
							searchParams
						);
						if (acceptedAccounts.length === 0)
							throw new BadRequestError('No se encontró una cuenta bancaria destino válida para este método de pago y moneda.');

						const targetAccount = acceptedAccounts[0];
						const apiUrl = targetAccount._Banks?.api_url;

						if (apiUrl) {
							try {
								const apiKey = targetAccount.api_key;
								const response = await fetch(`${apiUrl}/external/transactions/${reference_number}`, {
									method: 'GET',
									headers: {
										'Authorization': `Bearer ${apiKey}`,
										'Accept': 'application/json'
									}
								});
								const data: any = await response.json();

								if (!response.ok || !data.success) throw new BadRequestError(`El pago no pudo ser validado. Banco dice: ${data.message || 'Transacción fallida o no encontrada'}`);
								if (Number(data.data.amount) !== Number(amount)) throw new BadRequestError(`El monto de la transacción no coincide con el monto descrito.`);
							} catch (error: any) {
								if (error instanceof BadRequestError) throw error;
								throw new BadRequestError(`Error al comprobar la transacción con la entidad bancaria`, error);
							}
						} else {
							// Para otros bancos/monedas que no son Banky, se confía en la referencia por el momento (o pasará a validación manual)
						}

						const existingPayment = await this._orderPayments.getOne(
							{
								reference_number,
								payment_method: paymentMethodId
							},
							{
								attributes: ['id'],
								transaction,
								relations: [
									{
										attributes: ['id'],
										association: '_Orders',
										required: true,
										where: { order_status: { [Ops.in]: [1, 2, 4] } }
									},
									{
										attributes: ['id'],
										association: '_ExchangeRates',
										required: true,
										where: { currency: currency }
									}
								]
							}
						);

						if (existingPayment) throw new BadRequestError(`La referencia ${reference_number} ya fue procesada previamente.`);
					}
				} else if (paymentMethodId === PAYMENT_METHOD.CASH) {}

				await this._orderPayments.create(
					{
						order: order_id,
						payment_method: paymentMethodId,
						amount: amountBase,
						quoted_exchange_rate: quotedExchangeRateId,
						reference_number,
						is_approved: true,
					},
					{ transaction },
				);
			}

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

				// Verifica el rol para decidir si se completa la orden directamente o se requiere facturacion manual
				const isEmployee = !!session.roleCode;

				if (isEmployee) {
					await this._orders.update({ id: order_id }, { order_status: ORDER_STATUS.PAID, qr_code: qrCode }, { transaction });
					orderData = { ...order, qr_code: qrCode, order_status: ORDER_STATUS.PAID, is_employee: true };
				} else {
					// Si es un cliente directo, genera factura automatica usando sus datos de sesion
					const customer = await this._customers.getById(session.customerId, {
						relations: this._customers._relations,
						transaction,
					});
					const billingData = {
						name: `${customer._People.first_name}${customer._People?.last_name ? ` ${customer._People.last_name}` : ''}`.trim(),
						document: customer._People.document_number,
						address: '',
					};
					await this._generateInvoice(order_id, billingData, order.cinema, transaction);
					await this._orders.update({ id: order_id }, { order_status: ORDER_STATUS.ONLINE_PAID, qr_code: qrCode }, { transaction });
					orderData = { ...order, qr_code: qrCode, order_status: ORDER_STATUS.ONLINE_PAID, is_employee: false };
				}

				// Actualiza inventario
				if (concessions.length > 0)
					await this._deductPhysicalInventory(concessions, order, session.userId, transaction);

				// Otorga puntos de lealtad
				await this._awardLoyaltyPoints(order, transaction);
			} else {
				remaining_balance = MathUtil.roundMoney(Number(order.total_amount_base_currency) - totalPaid);
			}
		});

		// Acciones posteriores si la orden fue pagada completamente (o requiere billing)
		if (orderData && (orderData.order_status === ORDER_STATUS.PAID || orderData.order_status === ORDER_STATUS.ONLINE_PAID)) {
			if (orderData.is_employee) {
				// Extiende la sesion 24 horas para obligar al empleado a facturar
				quoteData.status = SHOPPING_SESSION_STATUS.PENDING_BILLING;
				await this._redis.set(userQueueKey, JSON.stringify(quoteData), 'EX', 86400);

				RealtimeProvider.getInstance().emitToRoom(`usr_${session.userId}`, 'billing_required', {
					orderId: order_id,
					qrCode: orderData.qr_code,
				});
			} else {
				await this._redis.del(userQueueKey);
				RealtimeProvider.getInstance().emitToRoom(`usr_${session.userId}`, 'payment_success', {
					orderId: order_id,
					qrCode: orderData.qr_code,
				});
			}

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
					for (const seatId of seatIds) pipeline.zrem(`showtime:${showtimeId}:locked_seats`, String(seatId));

					await pipeline.exec();

					RealtimeProvider.getInstance().emitToRoom(`showtime_${showtimeId}`, 'seats_sold_final', {
						seatIds,
					});
				}
			}

			// Envia correo de confirmacion de compra si la orden se completó
			if (orderData.order_status === ORDER_STATUS.ONLINE_PAID) {
				const customerEmail = await this._getCustomerEmail(orderData.customer, session);
				if (customerEmail) {
					QueueProvider.getInstance()
						.add('order-email-queue', 'send-order-email', {
							orderId: order_id,
							qrCode: orderData.qr_code,
							email: customerEmail,
						})
						.catch((err) => console.error(err));
				}
			}
		} else if (remaining_balance !== null && remaining_balance > 0) {
			return { remaining_balance, message: 'Pago parcial registrado exitosamente' };
		}

		return orderData;
	}

	async processBilling(body: any, session: any) {
		const { use_customer_data, billing_name, billing_document, billing_address } = body;
		const userQueueKey = `queue:usr:${session.userId}`;

		// Verifica que el usuario sea empleado
		if (!session.roleCode)
			throw new ForbiddenError('Solo los empleados pueden facturar ordenes mediante este endpoint.');

		// Valida que la orden exista y pertenezca a la sesion o al menos este en proceso
		const quoteRaw = await this._redis.get(userQueueKey);
		if (!quoteRaw) throw new NotFoundError('No existe una sesión de compra activa.');
		const quoteData = JSON.parse(quoteRaw);

		if (quoteData.status !== SHOPPING_SESSION_STATUS.PENDING_BILLING)
			throw new BadRequestError('La sesión no se encuentra en etapa de facturación.');

		await this._orders.transaction(async (transaction: Transaction) => {
			const order = await this._orders.getOne(
				{ id: quoteData.order_id },
				{
					transaction,
					lock: transaction.LOCK.UPDATE,
					relations: [{ association: '_Customers', nested: [{ association: '_People' }] }],
				},
			);

			if (!order) throw new NotFoundError('Orden no encontrada.');
			if (order.order_status !== ORDER_STATUS.PAID) throw new BadRequestError('La orden no se encuentra en estado pagada.');

			let billingData = { name: billing_name, document: billing_document, address: billing_address };

			if (use_customer_data) {
				if (!order._Customers || !order._Customers._People) {
					throw new BadRequestError(
						'La orden no tiene un cliente asociado para extraer los datos de facturación.',
					);
				}
				const person = order._Customers._People;
				billingData = {
					name: `${person.first_name} ${person.last_name ?? ''}`.trim(),
					document: person.document_number,
					address: '',
				};
			} else if (!billing_name || !billing_document) {
				throw new BadRequestError('Debe proporcionar nombre y documento para la factura.');
			}

			await this._generateInvoice(quoteData.order_id, billingData, order.cinema, transaction);
			await this._orders.update({ id: quoteData.order_id }, { order_status: ORDER_STATUS.ONLINE_PAID }, { transaction });
		});

		// Limpia la sesion y emite el success final
		await this._redis.del(userQueueKey);
		const finalOrder = await this._orders.getById(quoteData.order_id);

		RealtimeProvider.getInstance().emitToRoom(`usr_${session.userId}`, 'payment_success', {
			orderId: quoteData.order_id,
			qrCode: finalOrder.qr_code,
		});

		// Envia correo
		const customerEmail = await this._getCustomerEmail(finalOrder.customer, session);
		if (customerEmail) {
			QueueProvider.getInstance()
				.add('order-email-queue', 'send-order-email', {
					orderId: quoteData.order_id,
					qrCode: finalOrder.qr_code,
					email: customerEmail,
				})
				.catch((err) => console.error(err));
		}

		return { message: 'Facturación completada exitosamente y orden finalizada.' };
	}

	async getOrderById(id: number | string, session: any) {
		const orderId = Number(id);

		if (isNaN(orderId)) throw new BadRequestError('El ID de la orden debe ser un número válido');

		const order = await this._orders.getById(orderId);
		if (!order) throw new NotFoundError('Orden no encontrada');

		// Si el usuario no tiene rol (es cliente), debe ser dueño de la orden
		if (!session.roleCode)
			if (order.customer !== session.customerId)
				throw new ForbiddenError('No tienes permiso para ver esta orden');

		return order;
	}

	async getConcessionsByQr(qrCode: string) {
		const order = await this._orders.getOne({ qr_code: qrCode });
		if (!order) throw new NotFoundError('Código QR inválido');

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
		if (validation_type === VALIDATION_TYPE.MANUAL) {
			if (!payload.c_exp || Math.floor(Date.now() / 1000) > payload.c_exp) {
				throw new BadRequestError('Código QR de confitería expirado o inválido');
			}
		} else if (validation_type === VALIDATION_TYPE.QR) {
			if (!payload.t_exp || Math.floor(Date.now() / 1000) > payload.t_exp) {
				throw new BadRequestError('Código QR de boletos expirado o inválido');
			}
		}

		const order = await this._orders.getOne({ qr_code: qrCode });
		if (!order) throw new NotFoundError('Código QR inválido');

		// Registra el uso para prevenir multiples validaciones del mismo codigo
		if (validation_type === VALIDATION_TYPE.MANUAL) {
			if (order.concessions_validated_at) throw new ConflictError('Confitería ya validada');
			await this._orders.update({ id: order.id }, { concessions_validated_at: new Date() });
		} else if (validation_type === VALIDATION_TYPE.QR) {
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
		const comboIds = concessions.filter((c: any) => c.line_type === LINE_TYPE.COMBO && c.combo).map((c: any) => c.combo);

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
			if (item.line_type === LINE_TYPE.PRODUCT && item.product) {
				requiredProducts[item.product] = (requiredProducts[item.product] || 0) + item.quantity;
			} else if (item.line_type === LINE_TYPE.COMBO && item.combo) {
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
			if (inventories.length !== productIds.length) {
				const foundIds = new Set(inventories.map((inv: any) => inv.product));
				const missing = productIds.filter((pid: number) => !foundIds.has(pid));
				throw new NotFoundError(
					`Los siguientes productos no tienen inventario en esta sucursal: ${missing.join(', ')}`,
				);
			}

			// Busca ordenes pendientes de otros usuarios para reservar inventario logico
			const comboPartsOfInterest = await this._comboProducts.getAll(
				{ count: false, attributes: ['combo', 'product', 'quantity'], operation: { transaction } },
				{ product: productIds }
			);
			const comboIdsOfInterest = [...new Set(comboPartsOfInterest.map((c: any) => c.combo))];

			const allPendingLines = await this._orderLines.getAll(
				{
					count: false,
					relations: [{ association: '_Orders', required: true, where: { order_status: [1], cinema } }],
					operation: { transaction },
				},
				{
					[Ops.or]: [
						{ product: productIds },
						{ combo: comboIdsOfInterest }
					]
				}
			);

			// Valida que el stock disponible alcance a cubrir la cantidad solicitada
			for (const inv of inventories) {
				const requiredQty = requiredProducts[inv.product];
				const pendingLines = allPendingLines.filter(
					(line: any) => line.product === inv.product || comboIdsOfInterest.includes(line.combo)
				);
				let pendingQty = 0;
				for (const line of pendingLines) {
					if (line.product === inv.product) {
						pendingQty += line.quantity;
					} else if (line.combo) {
						const parts = comboPartsOfInterest.filter((p: any) => p.combo === line.combo && p.product === inv.product);
						for (const part of parts) pendingQty += line.quantity * part.quantity;
					}
				}

				const lastMovements = await this._inventoryMovements.getAll(
					{ count: false, limit: 1, order: [['id', 'DESC']], operation: { transaction } },
					{ inventory: inv.id },
				);
				const currentStock = lastMovements.length > 0 ? Number(lastMovements[0].resulting_stock) : 0;

				const availableStock = currentStock - pendingQty;
				if (availableStock < requiredQty)
					throw new ConflictError(
						`Inventario insuficiente para producto ID ${inv.product}. Disponible real: ${Math.max(0, availableStock)}`,
					);
			}
		}
	}

	/**
	 * Calcula los precios para confiteria incluyendo modificadores, tipo de cambio e impuestos.
	 * Registra el subtotal y acumula los impuestos en el colector global de la orden.
	 */
	private async _calculateConcessionsPrices(
		concessions: any[],
		exchangeRatesDict: any,
		systemBaseCurrency: number,
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
				item.line_type === LINE_TYPE.PRODUCT
					? productPriceMap.get(item.product) || { price: 0, currency: systemBaseCurrency }
					: comboPriceMap.get(item.combo) || { price: 0, currency: systemBaseCurrency };

			const rateObj = exchangeRatesDict[priceData.currency] || { rate: 1, id: systemBaseCurrency };
			item.exchangeRateId = rateObj.id;
			const productData = item.product ? productsMap.get(item.product) : null;

			const context = {
				modifier_scope: MODIFIER_SCOPE.PRODUCTS, // Confitería
				cinemaId: concessions[0]?.cinema, // Not exact but typically orders are per cinema
				line_type: item.line_type,
				product_category: productData ? productData.product_category : null,
				product: item.product,
				combo: item.combo,
			};

			const { finalPrice: finalPriceInItemCurrency, appliedModifiers } = PricingService.calculateFinalPrice(
				priceData.price,
				context,
				priceData.currency,
				activeModifiers,
				opTypesMap,
				{ currentDate, currentTime, currentDay },
			);

			const roundMoney = MathUtil.roundMoney;
			const finalUnitPrice = roundMoney(finalPriceInItemCurrency * Number(rateObj.rate));

			item.appliedModifiers = appliedModifiers.map((mod: any) => ({
				price_modifier: mod.price_modifier,
				applied_amount_base_currency: roundMoney(mod.applied_amount * Number(rateObj.rate) * item.quantity),
			}));

			subtotalBase += finalUnitPrice * item.quantity;

			// Aplica reglas de impuestos vigentes basadas en la categoria de producto
			const itemTaxes = activeTaxes.filter((t: any) => {
				if (t.tax_scope !== TAX_SCOPE.PRODUCTS && t.tax_scope !== TAX_SCOPE.BOTH) return false;
				if (t.line_type && t.line_type !== item.line_type) return false;
				if (t.product_category && (!productData || t.product_category !== productData.product_category)) return false;
				if (t.product && t.product !== item.product) return false;
				if (t.combo && t.combo !== item.combo) return false;
				return true;
			});

			const uniqueTaxesMap = new Map<number, any>();
			for (const t of itemTaxes) {
				let score = 0;
				if (t.product || t.combo) score += 100;
				if (t.product_category) score += 10;
				if (t.line_type) score += 5;
				if (t.cinema) score += 1;

				const existing = uniqueTaxesMap.get(t.tax);
				if (!existing || score > existing.score) {
					uniqueTaxesMap.set(t.tax, { rule: t, score });
				}
			}

			for (const { rule } of uniqueTaxesMap.values()) {
				const taxRate = Number(rule._Taxes?.rate ?? 0);
				const taxAmount = roundMoney(finalUnitPrice * item.quantity * (taxRate / 100));
				taxesBase += taxAmount;
				if (!orderTaxesCollector[rule.tax]) orderTaxesCollector[rule.tax] = { rate: taxRate, amount: 0 };
				orderTaxesCollector[rule.tax].amount += taxAmount;
			}
			item.originalPrice = MathUtil.roundMoney(priceData.price * Number(rateObj.rate));
			item.finalPrice = finalUnitPrice;
		}
		return { subtotalBase, taxesBase };
	}

	private async _calculateTicketsPrices(
		tickets: any[],
		cinemaId: number,
		exchangeRatesDict: any,
		systemBaseCurrency: number,
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
			const seatData = seatsMap.get(ticket.seatId) as any;
			const rawBasePrice = showtimeData ? Number(showtimeData.price || 0) : 0;
			const currency = showtimeData ? showtimeData.currency || 1 : 1;
			const rateObj = exchangeRatesDict[currency] || { rate: 1, id: systemBaseCurrency };
			const basePrice = MathUtil.roundMoney(rawBasePrice * Number(rateObj.rate));
			ticket.exchangeRateId = rateObj.id;

			const context = {
				cinemaId,
				modifier_scope: MODIFIER_SCOPE.TICKETS,
				booking_type: bookingDb?.booking_type,
				movie: showtimeData?.movie,
				projection_type: showtimeData?.projection_type,
				seat_category: seatData?.seat_category,
				room_type: bookingDb?._Rooms?.room_type,
				audienceCategoryId: ticket.audienceCategoryId,
			};

			const { finalPrice: finalPriceInItemCurrency, appliedModifiers } = PricingService.calculateFinalPrice(
				rawBasePrice,
				context,
				currency,
				activeModifiers,
				opTypesMap,
				{ currentDate, currentTime, currentDay },
			);

			const roundMoney = MathUtil.roundMoney;
			const finalUnitPrice = roundMoney(finalPriceInItemCurrency * Number(rateObj.rate));

			ticket.appliedModifiers = appliedModifiers.map((mod: any) => ({
				price_modifier: mod.price_modifier,
				applied_amount_base_currency: roundMoney(mod.applied_amount * Number(rateObj.rate)),
			}));
			subtotalBase += finalUnitPrice;

			const ticketTaxes = activeTaxes.filter(
				(t: any) =>
					(t.tax_scope === TAX_SCOPE.TICKETS || t.tax_scope === TAX_SCOPE.BOTH) &&
					t.product === null &&
					t.combo === null &&
					t.product_category === null &&
					t.line_type === null
			);
			const uniqueTaxesMap = new Map<number, any>();
			for (const t of ticketTaxes) {
				let score = 0;
				if (t.cinema) score += 1;
				const existing = uniqueTaxesMap.get(t.tax);
				if (!existing || score > existing.score) {
					uniqueTaxesMap.set(t.tax, { rule: t, score });
				}
			}

			for (const { rule } of uniqueTaxesMap.values()) {
				const ticketTaxRate = Number(rule._Taxes?.rate ?? 0);
				const taxAmount = roundMoney(finalUnitPrice * (ticketTaxRate / 100));
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
			seat: ticket.seatId,
			audience_category: ticket.audienceCategoryId,
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
		const requiredProducts: Record<number, number> = {};
		const comboIds = concessions
			.filter((c: any) => c.line_type === LINE_TYPE.COMBO && (c.combo || c._Combos?.id))
			.map((c: any) => c.combo || c._Combos?.id);
		let allComboParts: any[] = [];
		if (comboIds.length > 0) {
			allComboParts = await this._comboProducts.getAll(
				{ count: false, operation: { transaction } },
				{ combo: comboIds },
			);
		}
		for (const line of concessions) {
			if (line.line_type === LINE_TYPE.PRODUCT) {
				const pId = line.product || line._Products?.id;
				if (pId) requiredProducts[pId] = (requiredProducts[pId] || 0) + Number(line.quantity);
			} else if (line.line_type === LINE_TYPE.COMBO) {
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
			const lastMovements = await this._inventoryMovements.getAll(
				{ count: false, limit: 1, order: [['id', 'DESC']], operation: { transaction } },
				{ inventory: inv.id },
			);
			const currentStock = lastMovements.length > 0 ? Number(lastMovements[0].resulting_stock) : 0;
			const newStock = currentStock - qty;
			if (newStock < 0)
				throw new ConflictError(`Stock insuficiente para el producto ${productId}`, 'INSUFFICIENT_STOCK');

			const unitCost = lastMovements.length > 0 ? Number(lastMovements[0].resulting_unit_cost_base_currency) : 0;
			await this._inventoryMovements.create(
				{
					inventory: inv.id,
					operation_type: INVENTORY_OPERATION.SALE,
					quantity: qty,
					unit_cost: unitCost,
					currency: order.system_base_currency,
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
			const customer = await this._customers.getById(order.customer, {
				attributes: ['id', 'level_progress_points'],
				transaction,
				lock: transaction.LOCK.UPDATE,
			});
			const currentLevelPoints = Number(customer?.level_progress_points ?? 0);
			const earnedPoints = Number(order.generated_points);
			const newLevelPoints = currentLevelPoints + earnedPoints;

			const ledgers = await this._loyaltyLedgers.getAll(
				{ count: false, order: [['id', 'DESC']], limit: 1, operation: { transaction, lock: transaction.LOCK.UPDATE } },
				{ customer: order.customer },
			);
			const currentSpendableBalance = ledgers.length > 0 ? Number(ledgers[0].points_balance) : 0;
			const newSpendableBalance = currentSpendableBalance + earnedPoints;

			await this._loyaltyLedgers.create(
				{
					customer: order.customer,
					order: order.id,
					operation_type: LOYALTY_OPERATION.EARN,
					points: earnedPoints,
					points_balance: newSpendableBalance,
					remarks: `Puntos ganados por compra en orden #${order.id}`,
				},
				{ transaction },
			);
			await this._customers.update(order.customer, { level_progress_points: newLevelPoints }, { transaction });
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
				n: c.line_type === LINE_TYPE.PRODUCT ? c._Products?.name : c._Combos?.name,
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

	private async _generateInvoice(order_id: number, billingData: any, cinema: number, transaction: Transaction) {
		const sequence = await this._invoiceSequences.getOne(
			{ cinema },
			{ lock: transaction.LOCK.UPDATE, transaction },
		);

		if (!sequence) throw new Error('Secuencia de facturación no configurada para esta sucursal');

		const nextValue = sequence.current_value + 1;
		const invoiceNumber = `${sequence.prefix}${nextValue.toString().padStart(6, '0')}`;

		await this._invoices.create(
			{
				order: order_id,
				invoice_number: invoiceNumber,
				billing_document: billingData.document,
				billing_name: billingData.name,
				billing_address: billingData.address || '',
			},
			{ transaction },
		);

		await this._invoiceSequences.update({ id: sequence.id }, { current_value: nextValue }, { transaction });
	}
}

export default new OrdersService();
