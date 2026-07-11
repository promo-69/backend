import { ControllerBase } from '@bases/controller.base.js';
import LoyaltyRewardsService from '@modules/loyalty-rewards/_.service.js';

class BlankTicketsController extends ControllerBase {
	constructor() {
		super();
	}

	// GET /api/v1/blank-tickets/:code -> valida un vale
	async validate() {
		const { code } = this.getParams();
		const info = await LoyaltyRewardsService.getBlankTicketByCode(String(code));
		return this.success(info);
	}
}

export default new BlankTicketsController();
