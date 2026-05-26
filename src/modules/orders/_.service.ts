import { BaseService } from '@bases/service.base.js';
import { Database } from '@database/index.js';
import { CacheDatabaseProvider } from '@providers/cache-database.provider.js';
import { QueueProvider } from '@providers/queue.provider.js';
import { RealtimeService } from '@services/realtime.service.js';
import { AppError, ValidationError } from '@errors/index.js';
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

	async createQuote(body: { cinema: number }, session: any) {
		const { cinema } = body;
		if (!cinema) throw new ValidationError('Cinema ID is required', []);

		// Fetch latest exchange rate correctly (Regla 2)
		const latestRates = await this._exchangeRates.getAll({ count: false, limit: 1, order: [['id', 'DESC']] });
		const activeRate = latestRates[0] || null;

		const queueId = randomUUID();
		const quoteData = {
			status: 'pending',
			cinema,
			exchange_rates: activeRate,
			created_at: Date.now(),
		};

		const redisKey = `queue:usr:${session.userId}:id:${queueId}`;
		await this._redis.set(redisKey, JSON.stringify(quoteData), 'EX', 600); // 10 minutes TTL estrictamente (Regla 2)

		return {
			queue_id: queueId,
			expires_in: 600,
		};
	}

	async processCheckout(body: any, session: any) {
		const { queue_id, concessions, tickets } = body;
		if (!queue_id) throw new ValidationError('Queue ID is required', []);

		const redisKey = `queue:usr:${session.userId}:id:${queue_id}`;
		const quoteRaw = await this._redis.get(redisKey);
		if (!quoteRaw) {
			throw new AppError({
				statusCode: 400,
				message: 'La sesión de compra ha expirado o no existe.',
			});
		}

		const quoteData = JSON.parse(quoteRaw);
		
		let createdOrder: any = null;

		await this._orders.transaction(async (transaction: Transaction) => {
			// This is a simplified version of the logic. Needs deep implementation for row-locks and physical availability.
			
			// 1. Calculate subtotals base currency
			const subtotal = 100.00; // Placeholder
			const taxes = 16.00; // Placeholder
			const total = 116.00; // Placeholder

			// 2. Create Order
			createdOrder = await this._orders.create({
				customer: session.userId, // Requires adjusting if session maps customer differently
				cinema: quoteData.cinema,
				system_base_currency: 1, // Standard ID for base currency
				subtotal_base_currency: subtotal,
				tax_amount_base_currency: taxes,
				total_amount_base_currency: total,
				generated_points: Math.floor(total),
				order_status: 1, // PENDING
			}, { transaction });

			// 3. Process Concessions (Lines) and Deduct Inventories... (Regla 3)
			if (concessions && Array.isArray(concessions)) {
				for (const concession of concessions) {
					await this._orderLines.create({
						order: createdOrder.id,
						line_type: concession.line_type,
						product: concession.product || null,
						combo: concession.combo || null,
						quantity: concession.quantity,
						original_unit_price: 10,
						unit_price: 10,
						quoted_exchange_rate: quoteData.exchange_rates?.id || 1,
					}, { transaction });
				}
			}
			
			// 4. Process Tickets and Row Locks... (Regla 3)
			if (tickets && Array.isArray(tickets)) {
				for (const ticket of tickets) {
					await this._tickets.create({
						order: createdOrder.id,
						booking: ticket.booking || ticket.showtime, // Support fallback
						seat: ticket.seat,
						original_price: 5,
						price: 5,
						quoted_exchange_rate: quoteData.exchange_rates?.id || 1,
						qr_code: randomUUID(), // Temporary qr_code for physical ticket requirement
					}, { transaction });
				}
			}
		});

		// 5. Fire delayed job for order expiration
		QueueProvider.getInstance().add(
			'order-expiration-queue',
			'expire-pending-order',
			{ orderId: createdOrder.id, queueId: queue_id },
			{ delay: 900_000 } // 15 minutes
		).catch(err => console.error(err));

		return {
			order_id: createdOrder.id,
			subtotal_base_currency: createdOrder.subtotal_base_currency,
			total_amount_base_currency: createdOrder.total_amount_base_currency
		};
	}

	async registerPayment(body: any, session: any) {
		const { order_id, payment_method, amount, currency, reference_number } = body;
		
		let orderData: any = null;

		await this._orders.transaction(async (transaction: Transaction) => {
			const order = await this._orders.getOne({ id: order_id }, { 
				transaction, 
				lock: transaction.LOCK.UPDATE,
				relations: [
					{ association: '_OrderLines', required: false },
					{ association: '_Tickets', required: false, include: [{ association: '_RoomBookings', required: false }] }
				]
			});
			if (!order) throw new AppError({ statusCode: 404, message: 'Order not found' });
			if (order.order_status !== 1) throw new AppError({ statusCode: 400, message: 'Order is not in pending status' });

			// Calculate amount in base currency using exchange rates
			
			// Create payment
			await this._orderPayments.create({
				order: order_id,
				payment_method,
				amount,
				quoted_exchange_rate: 1, // Placeholder
				reference_number,
				is_approved: true
			}, { transaction });

			// Verify if total is paid
			const payments = await this._orderPayments.getAll({ count: false }, { order: order_id }, { transaction });
			const totalPaid = payments.reduce((acc: number, p: any) => acc + Number(p.amount), 0);

			if (totalPaid >= Number(order.total_amount_base_currency)) {
				// Generación y Expiración Dinámica del JWT (Regla 4)
				const secret = AppConfig.load().security.jwtSecret;
				const tickets = (order as any)._Tickets;
				const concessions = (order as any)._OrderLines;

				const hasTickets = tickets && tickets.length > 0;
				const hasConcessions = concessions && concessions.length > 0;
				
				let t_exp: number | null = null;
				let c_exp: number | null = null;
				let expiresInSeconds = 86400; // 24 horas por defecto
				
				if (hasTickets) {
					const ticketData = tickets[0];
					const endTime = ticketData?._RoomBookings?.end_time || (new Date(Date.now() + 7200000));
					t_exp = Math.floor(new Date(endTime).getTime() / 1000);
					expiresInSeconds = Math.max(t_exp - Math.floor(Date.now() / 1000), 0);
				}

				if (hasConcessions) {
					const endOfDay = new Date();
					endOfDay.setHours(23, 59, 59, 999);
					c_exp = Math.floor(endOfDay.getTime() / 1000);
					expiresInSeconds = Math.max(expiresInSeconds, Math.max(c_exp - Math.floor(Date.now() / 1000), 0));
				}

				const payload: any = { order_id };
				if (t_exp) payload.t_exp = t_exp;
				if (c_exp) payload.c_exp = c_exp;

				const qrCode = JWTUtil.generateToken(payload, secret, expiresInSeconds);

				await this._orders.update({ id: order_id }, { order_status: 2, qr_code: qrCode }, { transaction }); // PAID
				
				// Deduct stock physically
				
				orderData = { ...order, qr_code: qrCode, order_status: 2 };
			}
		});

		if (orderData && orderData.order_status === 2) {
			// Trigger WS and Email
			// RealtimeService.emitToRoom(...)
			QueueProvider.getInstance().add(
				'order-email-queue',
				'send-order-email',
				{ orderId: order_id, qrCode: orderData.qr_code, email: session.email }
			).catch(err => console.error(err));
		}

		return { success: true, status: orderData ? 'PAID' : 'PENDING' };
	}

	async getOrderById(id: number) {
		// Regla 1: Usar relations en lugar de include
		return await this._orders.getById(id, {
			relations: [
				{ association: '_OrderLines', required: false },
				{ association: '_Tickets', required: false },
				{ association: '_OrderPayments', required: false },
				{ association: '_Cinemas', required: false },
				{ association: '_Customers', required: false }
			]
		});
	}

	async getConcessionsByQr(qrCode: string) {
		const order = await this._orders.getOne({ qr_code: qrCode });
		if (!order) throw new AppError({ statusCode: 404, message: 'Invalid QR code' });

		// Regla 1: Usar relations en lugar de include
		const lines = await this._orderLines.getAll({ count: false }, { order: order.id }, {
			relations: [
				{ association: '_Products', required: false },
				{ association: '_Combos', required: false },
				{ association: '_LineTypes', required: false }
			]
		});
		return { concessions: lines, concessions_used: order.concessions_validated_at !== null };
	}

	async getTicketsByQr(qrCode: string) {
		const order = await this._orders.getOne({ qr_code: qrCode });
		if (!order) throw new AppError({ statusCode: 404, message: 'Invalid QR code' });

		// Regla 1: Usar relations en lugar de include
		const tickets = await this._tickets.getAll({ count: false }, { order: order.id }, {
			relations: [
				{ association: '_Seats', required: false },
				{ association: '_RoomBookings', required: false }
			]
		});
		return { tickets, tickets_used: order.tickets_validated_at !== null };
	}

	async validateQr(qrCode: string, body: any, session: any) {
		const { validation_type } = body; // 1 = CONCESSIONS, 2 = TICKETS
		
		// Regla 5: Validación Condicional Estricta
		const secret = AppConfig.load().security.jwtSecret;
		let payload: any;
		try {
			payload = JWTUtil.verifyToken(qrCode, secret);
		} catch (error) {
			throw new AppError({ statusCode: 400, message: 'Invalid or expired QR code token' });
		}

		if (validation_type === 1) {
			if (!payload.c_exp || Math.floor(Date.now() / 1000) > payload.c_exp) {
				throw new AppError({ statusCode: 400, message: 'Concessions QR has expired or is invalid' });
			}
		} else if (validation_type === 2) {
			if (!payload.t_exp || Math.floor(Date.now() / 1000) > payload.t_exp) {
				throw new AppError({ statusCode: 400, message: 'Tickets QR has expired or is invalid' });
			}
		}

		const order = await this._orders.getOne({ qr_code: qrCode });
		if (!order) throw new AppError({ statusCode: 404, message: 'Invalid QR code' });

		if (validation_type === 1) {
			if (order.concessions_validated_at) throw new AppError({ statusCode: 409, message: 'Concessions already validated' });
			await this._orders.update({ id: order.id }, { concessions_validated_at: new Date() });
		} else if (validation_type === 2) {
			if (order.tickets_validated_at) throw new AppError({ statusCode: 409, message: 'Tickets already validated' });
			await this._orders.update({ id: order.id }, { tickets_validated_at: new Date() });
		} else {
			throw new ValidationError('Invalid validation type', []);
		}

		return { success: true };
	}

	async handleQuoteExpiration(queueId: string, userId: number) {
		// Emit WS event
		RealtimeService.emitToRoom(`queue_${queueId}`, 'quote_expired', { queueId });
	}

	async handleSeatExpiration(showtimeId: number, seatId: number, queueId: string) {
		// Emit WS event
		RealtimeService.emitToRoom(`showtime_${showtimeId}`, 'seat_unlocked', { seatId, showtimeId });
		// Also emit to the user's private queue so they know they lost it
		if (queueId) RealtimeService.emitToRoom(`queue_${queueId}`, 'seat_lock_expired', { seatId, showtimeId });
	}

	async expirePendingOrder(orderId: number, queueId: string) {
		await this._orders.transaction(async (transaction: Transaction) => {
			const order = await this._orders.getOne({ id: orderId }, { transaction, lock: transaction.LOCK.UPDATE });
			
			if (order && order.order_status === 1) { // If still PENDING
				// Cancel order
				await this._orders.update({ id: orderId }, { order_status: 3 }, { transaction }); // CANCELLED status (assuming 3 is cancelled)
				
				// Regla 6: Lógica Compensatoria Real (Soft Delete en tickets)
				await this._tickets.delete({ order: orderId }, { transaction });
				
				Logger.info(`[OrdersService] Orden ${orderId} expiró y fue cancelada.`);
				
				// Notify frontend
				RealtimeService.emitToRoom(`queue_${queueId}`, 'order_expired', { orderId });
			}
		});
	}
}
