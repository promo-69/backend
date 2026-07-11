import { Transaction } from 'sequelize';
import { customAlphabet } from 'nanoid';
import { BaseService } from '@bases/service.base.js';
import { Database } from '@database/index.js';
import { NotFoundError, ValidationError, BadRequestError, ForbiddenError } from '@errors/index.js';
import {
	ORDER_STATUS,
	LOYALTY_OPERATION,
	LINE_TYPE,
	REWARD_TYPE,
	BLANK_TICKET_STATUS,
	BLANK_TICKET_VALIDITY_DAYS,
} from '@constants/magic-vars.constant.js';
import OrderReceiptService from '@services/order-receipt.service.js';

// Código legible/tecleable para el boleto en blanco (sin caracteres ambiguos)
const generateBlankCode = customAlphabet('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', 10);

const REDEEMABLE_TYPES = new Set([
	REWARD_TYPE.PRODUCT,
	REWARD_TYPE.COMBO,
	REWARD_TYPE.BLANK_TICKET,
	REWARD_TYPE.TWO_FOR_ONE,
]);

interface CreateRewardBody {
	name: string;
	description?: string;
	imageUrl?: string;
	pointsCost: number;
	requiredLoyaltyLevel: number;
	cinema?: number;
	rewardType: string;
	product?: number | null;
	combo?: number | null;
	quantity?: number;
	startDate?: string | Date | null;
	endDate?: string | Date | null;
	isActive?: boolean;
}

type UpdateRewardBody = Partial<CreateRewardBody>;

export class LoyaltyRewardsService extends BaseService {
	constructor() {
		super();
	}

	private get _loyaltyRewards() {
		return Database.repository('main', 'loyalty-rewards') as any;
	}
	private get _rewardRedemptions() {
		return Database.repository('main', 'reward-redemptions') as any;
	}
	private get _blankTickets() {
		return Database.repository('main', 'blank-tickets') as any;
	}
	private get _loyaltyLedgers() {
		return Database.repository('main', 'loyalty-ledgers') as any;
	}
	private get _loyaltyLevels() {
		return Database.repository('main', 'loyalty-levels') as any;
	}
	private get _customers() {
		return Database.repository('main', 'customers') as any;
	}
	private get _orders() {
		return Database.repository('main', 'orders') as any;
	}
	private get _orderLines() {
		return Database.repository('main', 'order-lines') as any;
	}
	private get _exchangeRates() {
		return Database.repository('main', 'exchange-rates') as any;
	}

	// ---------------------------------------------------------------------------
	// Scoping por sucursal
	// Empleado: su usuario está anclado a una sucursal (session.cinemaId) y NO puede
	// cambiarla. Superadmin: no tiene cinemaId, debe indicar la sucursal en la que
	// está "parado" (provided). Mismo patrón que createQuote / showtimes.
	// ---------------------------------------------------------------------------
	private _resolveAdminCinema(session: any, provided?: number | null): number {
		const cinema = session?.cinemaId ?? provided ?? null;
		if (!cinema)
			throw new ValidationError('La sucursal es requerida: indica en qué sucursal estás configurando el premio', [
				'cinema',
			]);
		return Number(cinema);
	}

	// El empleado solo puede tocar premios de su sucursal.
	private _assertSameBranch(session: any, reward: any): void {
		if (session?.cinemaId && Number(reward.cinema) !== Number(session.cinemaId))
			throw new ForbiddenError('No puedes gestionar premios de otra sucursal');
	}

	// ---------------------------------------------------------------------------
	// Validación compartida
	// ---------------------------------------------------------------------------
	private _validateRewardShape(body: CreateRewardBody, partial = false): void {
		const { rewardType, pointsCost, requiredLoyaltyLevel, quantity } = body;

		if (!partial) {
			this.validateRequired(body as any, ['name', 'pointsCost', 'requiredLoyaltyLevel', 'rewardType']);
		}

		if (rewardType !== undefined && !REDEEMABLE_TYPES.has(rewardType))
			throw new ValidationError(
				`rewardType inválido. Debe ser uno de: ${Array.from(REDEEMABLE_TYPES).join(', ')}`,
				['rewardType'],
			);

		if (pointsCost !== undefined && (!Number.isInteger(pointsCost) || pointsCost <= 0))
			throw new ValidationError('pointsCost debe ser un entero positivo', ['pointsCost']);

		if (
			requiredLoyaltyLevel !== undefined &&
			(!Number.isInteger(requiredLoyaltyLevel) || requiredLoyaltyLevel <= 0)
		)
			throw new ValidationError('requiredLoyaltyLevel debe ser un entero positivo', ['requiredLoyaltyLevel']);

		if (quantity !== undefined && (!Number.isInteger(quantity) || quantity <= 0))
			throw new ValidationError('quantity debe ser un entero positivo', ['quantity']);

		// Coherencia tipo <-> referencia entregada (refleja chk_loyalty_rewards_type_ref)
		if (rewardType === REWARD_TYPE.PRODUCT && !body.product)
			throw new ValidationError('Un premio de tipo PRODUCT requiere product', ['product']);
		if (rewardType === REWARD_TYPE.COMBO && !body.combo)
			throw new ValidationError('Un premio de tipo COMBO requiere combo', ['combo']);
		if (
			(rewardType === REWARD_TYPE.BLANK_TICKET || rewardType === REWARD_TYPE.TWO_FOR_ONE) &&
			(body.product || body.combo)
		)
			throw new ValidationError('Un boleto en blanco / 2x1 no debe referenciar product ni combo', [
				'product',
				'combo',
			]);

		this._validateDateWindow(body.startDate, body.endDate);
	}

	private _validateDateWindow(startDate?: string | Date | null, endDate?: string | Date | null): void {
		if (startDate) {
			const s = new Date(startDate as any);
			if (isNaN(s.getTime())) throw new ValidationError('startDate inválido', ['startDate']);
		}
		if (endDate) {
			const e = new Date(endDate as any);
			if (isNaN(e.getTime())) throw new ValidationError('endDate inválido', ['endDate']);
		}
		if (startDate && endDate && new Date(endDate as any) < new Date(startDate as any))
			throw new ValidationError('endDate no puede ser anterior a startDate', ['endDate']);
	}

	// ---------------------------------------------------------------------------
	// Admin CRUD (con scoping por sucursal)
	// ---------------------------------------------------------------------------
	async createReward(body: CreateRewardBody, session: any) {
		this._validateRewardShape(body, false);
		const cinema = this._resolveAdminCinema(session, body.cinema);

		const quantity = body.rewardType === REWARD_TYPE.TWO_FOR_ONE ? (body.quantity ?? 2) : (body.quantity ?? 1);

		const created = await this._loyaltyRewards.create({
			name: body.name,
			description: body.description ?? null,
			image_url: body.imageUrl ?? null,
			points_cost: body.pointsCost,
			required_loyalty_level: body.requiredLoyaltyLevel,
			cinema,
			reward_type: body.rewardType,
			product: body.product ?? null,
			combo: body.combo ?? null,
			quantity,
			start_date: body.startDate ? new Date(body.startDate as any) : null,
			end_date: body.endDate ? new Date(body.endDate as any) : null,
			is_active: body.isActive ?? true,
		});

		return created;
	}

	async listRewards(session: any, query?: { cinema?: number }) {
		// Empleado: forzado a su sucursal. Superadmin: filtra por la indicada, o ve todas.
		const cinema = session?.cinemaId ?? query?.cinema ?? null;
		const where = cinema ? { cinema: Number(cinema) } : {};
		return this._loyaltyRewards.getAll({ count: false, order: [['required_loyalty_level', 'ASC']] }, where);
	}

	async getRewardById(id: number, session: any) {
		const reward = await this._loyaltyRewards.getOne({ id });
		if (!reward) throw new NotFoundError('Premio no encontrado');
		this._assertSameBranch(session, reward);
		return reward;
	}

	async updateReward(id: number, body: UpdateRewardBody, session: any) {
		const reward = await this._loyaltyRewards.getOne({ id });
		if (!reward) throw new NotFoundError('Premio no encontrado');
		this._assertSameBranch(session, reward);

		this._validateRewardShape({ ...reward, ...body } as any, true);

		const updateData: Record<string, any> = {};
		if (body.name !== undefined) updateData.name = body.name;
		if (body.description !== undefined) updateData.description = body.description;
		if (body.imageUrl !== undefined) updateData.image_url = body.imageUrl;
		if (body.pointsCost !== undefined) updateData.points_cost = body.pointsCost;
		if (body.requiredLoyaltyLevel !== undefined) updateData.required_loyalty_level = body.requiredLoyaltyLevel;
		if (body.rewardType !== undefined) updateData.reward_type = body.rewardType;
		if (body.product !== undefined) updateData.product = body.product;
		if (body.combo !== undefined) updateData.combo = body.combo;
		if (body.quantity !== undefined) updateData.quantity = body.quantity;
		if (body.startDate !== undefined)
			updateData.start_date = body.startDate ? new Date(body.startDate as any) : null;
		if (body.endDate !== undefined) updateData.end_date = body.endDate ? new Date(body.endDate as any) : null;
		if (body.isActive !== undefined) updateData.is_active = body.isActive;
		// La sucursal de un premio no se reasigna desde update.

		if (Object.keys(updateData).length === 0)
			throw new ValidationError('No se proporcionaron datos para actualizar', []);

		await this._loyaltyRewards.update(id, updateData);
		return null;
	}

	async deleteReward(id: number, session: any) {
		const reward = await this._loyaltyRewards.getOne({ id });
		if (!reward) throw new NotFoundError('Premio no encontrado');
		this._assertSameBranch(session, reward);
		await this._loyaltyRewards.delete(id);
		return null;
	}

	// ---------------------------------------------------------------------------
	// Cliente: catálogo disponible, agrupado por nivel, por sucursal
	// ---------------------------------------------------------------------------
	async getAvailableRewards(session: any, query?: { cinema?: number }) {
		const cinema = query?.cinema ? Number(query.cinema) : null;
		if (!cinema)
			throw new ValidationError('La sucursal es requerida para ver las promociones disponibles', ['cinema']);

		const customerId = session?.customerId ? Number(session.customerId) : null;

		let customerLevel = 0;
		let pointsBalance = 0;
		if (customerId) {
			const customer = await this._customers.getById(customerId);
			customerLevel = customer?.loyalty_level ?? 0;
			pointsBalance = await this._getBalance(customerId);
		}

		const now = new Date();
		const rewards: any[] = await this._loyaltyRewards.getAll(
			{
				count: false,
				order: [
					['required_loyalty_level', 'ASC'],
					['points_cost', 'ASC'],
				],
			},
			{ is_active: true, cinema },
		);

		const levels: any[] = await this._loyaltyLevels.getAll(
			{ count: false, order: [['required_points', 'ASC']] },
			{},
		);
		const levelById = new Map<number, any>(levels.map((l) => [l.id, l]));

		const activeRewards = rewards.filter((r) => this._isWithinWindow(r, now));

		const grouped = new Map<number, any[]>();
		for (const r of activeRewards) {
			const levelId = r.required_loyalty_level;
			const unlocked = customerLevel >= levelId;
			const affordable = pointsBalance >= r.points_cost;
			const item = {
				id: r.id,
				name: r.name,
				description: r.description,
				image_url: r.image_url,
				points_cost: r.points_cost,
				reward_type: r.reward_type,
				quantity: r.quantity,
				required_loyalty_level: levelId,
				unlocked,
				affordable,
				claimable: unlocked && affordable,
			};
			if (!grouped.has(levelId)) grouped.set(levelId, []);
			grouped.get(levelId)!.push(item);
		}

		const sections = Array.from(grouped.entries())
			.sort((a, b) => a[0] - b[0])
			.map(([levelId, items]) => ({
				level: {
					id: levelId,
					name: levelById.get(levelId)?.name ?? null,
					required_points: levelById.get(levelId)?.required_points ?? null,
				},
				unlocked: customerLevel >= levelId,
				rewards: items,
			}));

		return {
			customer: { loyalty_level: customerLevel, points_balance: pointsBalance },
			cinema,
			sections,
		};
	}

	// ---------------------------------------------------------------------------
	// Cliente: canje
	// ---------------------------------------------------------------------------
	async redeemReward(rewardId: number, body: { cinema?: number }, session: any) {
		const customerId = session?.customerId ? Number(session.customerId) : null;
		if (!customerId) throw new ValidationError('Se requiere una sesión de cliente para canjear', ['session']);

		// El cliente elige la sucursal en la que canjea; la orden se asocia a ella.
		const cinema = body?.cinema ? Number(body.cinema) : null;
		if (!cinema) throw new ValidationError('Se requiere la sucursal (cinema) para el canje', ['cinema']);

		const reward = await this._loyaltyRewards.getOne({ id: rewardId });
		if (!reward || reward.is_active === false) throw new NotFoundError('Premio no encontrado o inactivo');

		// El premio pertenece a una sucursal: solo se canjea en la suya.
		if (Number(reward.cinema) !== cinema)
			throw new BadRequestError('Este premio no está disponible en la sucursal seleccionada');

		if (!this._isWithinWindow(reward, new Date()))
			throw new BadRequestError('El premio no está vigente en este momento');

		const result = await this._loyaltyRewards.transaction(async (transaction: Transaction) => {
			// Bloquear al cliente para lecturas coherentes de nivel/saldo
			const customer = await this._customers.getById(customerId, {
				transaction,
				lock: transaction.LOCK.UPDATE,
			});
			if (!customer) throw new NotFoundError('Cliente no encontrado');

			// 1) Nivel requerido
			if ((customer.loyalty_level ?? 0) < reward.required_loyalty_level)
				throw new BadRequestError('Tu nivel de fidelidad no alcanza para canjear este premio');

			// 2) Saldo de puntos (último ledger, bloqueado)
			const balance = await this._getBalanceLocked(customerId, transaction);
			if (reward.points_cost > balance) throw new BadRequestError('Saldo de puntos insuficiente');

			// 3) Orden del canje (total 0 en dinero + estado pagado)
			const order = await this._orders.create(
				{
					customer: customerId,
					cinema,
					system_base_currency: 1,
					subtotal_base_currency: 0,
					tax_amount_base_currency: 0,
					total_amount_base_currency: 0,
					generated_points: 0,
					order_status: ORDER_STATUS.PAID,
				},
				{ transaction },
			);

			// 4) Descuento de puntos (SPEND): solo baja el saldo, NO toca level_progress_points
			await this._loyaltyLedgers.create(
				{
					operation_type: LOYALTY_OPERATION.SPEND,
					customer: customerId,
					order: order.id,
					points: reward.points_cost,
					points_balance: balance - reward.points_cost,
					description: `Canje de premio #${reward.id} (${reward.name})`,
				},
				{ transaction },
			);

			// 5) Materializar el beneficio
			let vouchers: Array<{ code: string; expires_at: Date }> = [];
			if (reward.reward_type === REWARD_TYPE.BLANK_TICKET || reward.reward_type === REWARD_TYPE.TWO_FOR_ONE) {
				vouchers = await this._issueBlankTickets(reward, customerId, order.id, transaction);
			} else if (reward.reward_type === REWARD_TYPE.PRODUCT || reward.reward_type === REWARD_TYPE.COMBO) {
				// Se registra la entrega como línea de orden (precio 0: pagado con puntos), para que
				// aparezca en el recibo/historial. El inventario NO se descuenta aquí: se descuenta en
				// el retiro en taquilla (Fase B), cuando el cliente muestra el QR del recibo.
				const baseRate = await this._exchangeRates.getOne(
					{ currency: order.system_base_currency },
					{ order: [['id', 'DESC']], transaction },
				);
				await this._orderLines.create(
					{
						order: order.id,
						line_type: reward.reward_type === REWARD_TYPE.PRODUCT ? LINE_TYPE.PRODUCT : LINE_TYPE.COMBO,
						product: reward.product ?? null,
						combo: reward.combo ?? null,
						quantity: reward.quantity ?? 1,
						original_unit_price: 0,
						unit_price: 0,
						quoted_exchange_rate: baseRate?.id ?? order.system_base_currency,
					},
					{ transaction },
				);
			}

			// 6) Registro de auditoría del canje
			await this._rewardRedemptions.create(
				{
					reward: reward.id,
					customer: customerId,
					order: order.id,
					points_spent: reward.points_cost,
					redeemed_at: new Date(),
				},
				{ transaction },
			);

			return {
				order_id: order.id,
				reward_id: reward.id,
				reward_type: reward.reward_type,
				points_spent: reward.points_cost,
				new_balance: balance - reward.points_cost,
				vouchers: vouchers.map((v) => ({ code: v.code, expires_at: v.expires_at })),
			};
		});

		// Fuera de la transacción: genera el QR del recibo en la orden y encola el correo
		// (reutiliza order-email-queue). El cliente presenta este QR en taquilla para el retiro.
		let receiptQr = '';
		try {
			const email = await OrderReceiptService.resolveCustomerEmail(customerId, session);
			receiptQr = await OrderReceiptService.issueRedemptionReceipt(result.order_id, email);
		} catch (err) {
			console.error('No se pudo emitir el recibo del canje', err);
		}

		return { ...result, receipt_qr: receiptQr || null };
	}

	// ---------------------------------------------------------------------------
	// Boleto en blanco: validación (Fase B, taquilla)
	// ---------------------------------------------------------------------------
	async getBlankTicketByCode(code: string) {
		const bt = await this._blankTickets.getOne({ code });
		if (!bt) throw new NotFoundError('Boleto en blanco no encontrado');

		// Vencimiento perezoso: si ya pasó la vigencia, se marca EXPIRED.
		let status = bt.status;
		if (status === BLANK_TICKET_STATUS.ISSUED && new Date(bt.expires_at) < new Date()) {
			status = BLANK_TICKET_STATUS.EXPIRED;
			await this._blankTickets.update(bt.id, { status });
		}

		return {
			id: bt.id,
			code: bt.code,
			status,
			issued_at: bt.issued_at,
			expires_at: bt.expires_at,
			customer: bt.customer,
			reward: bt.reward,
			redeemable: status === BLANK_TICKET_STATUS.ISSUED,
		};
	}

	private async _issueBlankTickets(
		reward: any,
		customerId: number,
		issueOrderId: number,
		transaction: Transaction,
	): Promise<Array<{ code: string; expires_at: Date }>> {
		const qty = reward.quantity ?? 1;
		const issuedAt = new Date();
		const expiresAt = new Date(issuedAt.getTime() + BLANK_TICKET_VALIDITY_DAYS * 24 * 60 * 60 * 1000);

		const created: Array<{ code: string; expires_at: Date }> = [];
		for (let i = 0; i < qty; i++) {
			const code = await this._generateUniqueCode(transaction);
			await this._blankTickets.create(
				{
					code,
					reward: reward.id,
					customer: customerId,
					issue_order: issueOrderId,
					issued_at: issuedAt,
					expires_at: expiresAt,
					status: BLANK_TICKET_STATUS.ISSUED,
				},
				{ transaction },
			);
			created.push({ code, expires_at: expiresAt });
		}
		return created;
	}

	private async _generateUniqueCode(transaction: Transaction): Promise<string> {
		for (let attempt = 0; attempt < 5; attempt++) {
			const code = generateBlankCode();
			const existing = await this._blankTickets.getOne({ code }, { transaction });
			if (!existing) return code;
		}
		throw new BadRequestError('No se pudo generar un código único para el boleto en blanco');
	}

	// ---------------------------------------------------------------------------
	// Helpers de saldo y vigencia
	// ---------------------------------------------------------------------------
	private async _getBalance(customerId: number): Promise<number> {
		const last = await this._loyaltyLedgers.getOne({ customer: customerId }, { order: [['created_at', 'DESC']] });
		return last?.points_balance ?? 0;
	}

	private async _getBalanceLocked(customerId: number, transaction: Transaction): Promise<number> {
		const result = await this._loyaltyLedgers.getAll(
			{
				count: false,
				limit: 1,
				order: [['id', 'DESC']],
				operation: { transaction, lock: transaction.LOCK.UPDATE },
			},
			{ customer: customerId },
		);
		const list = Array.isArray(result) ? result : (result?.rows ?? []);
		return list[0]?.points_balance ?? 0;
	}

	private _isWithinWindow(reward: any, now: Date): boolean {
		if (reward.start_date && new Date(reward.start_date) > now) return false;
		if (reward.end_date) {
			// end_date es inclusivo hasta el final del día
			const end = new Date(reward.end_date);
			end.setHours(23, 59, 59, 999);
			if (end < now) return false;
		}
		return true;
	}
}

export default new LoyaltyRewardsService();
