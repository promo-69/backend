import { ControllerBase } from '@bases/controller.base.js';
import CustomersService from './_.service.js';

class CustomersController extends ControllerBase {
	constructor() {
		super();
	}

	// PATCH /api/v1/customers/:id/loyalty-points
	async adjustLoyaltyPoints() {
		const { id } = this.getParams();
		const body = this.getBody();
		await CustomersService.adjustLoyaltyPoints(Number(id), body);
		return this.success(null, 'Puntos de lealtad ajustados exitosamente.');
	}
}

export default new CustomersController();
