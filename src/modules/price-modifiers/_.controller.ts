import { ControllerBase } from '@bases/controller.base.js';
import PriceModifiersService from './_.service.js';

class PriceModifiersController extends ControllerBase {
	constructor() {
		super();
	}

	// POST /api/v1/price-modifiers
	async create() {
		const body = this.getBody();
		await PriceModifiersService.createPriceModifier(body);
		return this.created(null, 'Regla de precio creada exitosamente.');
	}

	// PUT /api/v1/price-modifiers/:id
	async update() {
		const { id } = this.getParams();
		const body = this.getBody();
		await PriceModifiersService.updatePriceModifier(Number(id), body);
		return this.success(null, 'Regla de precio actualizada.');
	}

	// DELETE /api/v1/price-modifiers/:id
	async remove() {
		const { id } = this.getParams();
		await PriceModifiersService.deletePriceModifier(Number(id));
		return this.success(null, 'Regla de precio desactivada.');
	}
}

export default new PriceModifiersController();
