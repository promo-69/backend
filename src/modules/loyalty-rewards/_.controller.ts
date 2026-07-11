import { ControllerBase } from '@bases/controller.base.js';
import LoyaltyRewardsService from './_.service.js';

class LoyaltyRewardsController extends ControllerBase {
	constructor() {
		super();
	}

	// ---- Admin (scoping por sucursal en el servicio) ----

	// POST /api/v1/loyalty-rewards
	async create() {
		const body = this.getBody();
		const session = this.getSession();
		const reward = await LoyaltyRewardsService.createReward(body, session);
		return this.created({ id: reward.id }, 'Premio de fidelidad creado exitosamente.');
	}

	// GET /api/v1/loyalty-rewards?cinema=:id
	async findAll() {
		const session = this.getSession();
		const query = this.getQuery();
		const rewards = await LoyaltyRewardsService.listRewards(session, query);
		return this.success(rewards);
	}

	// GET /api/v1/loyalty-rewards/:id
	async findById() {
		const { id } = this.getParams();
		const session = this.getSession();
		const reward = await LoyaltyRewardsService.getRewardById(Number(id), session);
		return this.success(reward);
	}

	// PUT /api/v1/loyalty-rewards/:id
	async update() {
		const { id } = this.getParams();
		const body = this.getBody();
		const session = this.getSession();
		await LoyaltyRewardsService.updateReward(Number(id), body, session);
		return this.success(null, 'Premio de fidelidad actualizado.');
	}

	// DELETE /api/v1/loyalty-rewards/:id
	async remove() {
		const { id } = this.getParams();
		const session = this.getSession();
		await LoyaltyRewardsService.deleteReward(Number(id), session);
		return this.success(null, 'Premio de fidelidad desactivado.');
	}

	// ---- Cliente ----

	// GET /api/v1/loyalty-rewards/available?cinema=:id
	async available() {
		const session = this.getSession();
		const query = this.getQuery();
		const catalog = await LoyaltyRewardsService.getAvailableRewards(session, query);
		return this.success(catalog);
	}

	// POST /api/v1/loyalty-rewards/:id/redeem
	async redeem() {
		const { id } = this.getParams();
		const body = this.getBody();
		const session = this.getSession();
		const result = await LoyaltyRewardsService.redeemReward(Number(id), body, session);
		return this.success(result, 'Canje realizado exitosamente.');
	}
}

export default new LoyaltyRewardsController();
