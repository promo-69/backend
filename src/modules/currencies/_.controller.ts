import { ControllerBase } from '@bases/controller.base.js';
import CurrenciesService from './_.service.js';

class CurrenciesController extends ControllerBase {
	constructor() {
		super();
	}
	// POST /api/v1/currencies
	async create() {
		const currency = await CurrenciesService.createCurrency(this.getBody());
		return this.created({ id: currency.id }, 'Moneda creada exitosamente.');
	}
	// GET /api/v1/currencies
	async findAll() {
		const currencies = await CurrenciesService.listCurrencies();
		return this.success(currencies);
	}
	// GET /api/v1/currencies/:id
	async findById() {
		const currency = await CurrenciesService.getCurrencyById(Number(this.getParams().id));
		return this.success(currency);
	}
	// PATCH /api/v1/currencies/:id
	async update() {
		await CurrenciesService.updateCurrency(Number(this.getParams().id), this.getBody(), this.getSession().userId);
		return this.success(null, 'Moneda actualizada exitosamente.');
	}
	// DELETE /api/v1/currencies/:id
	async remove() {
		await CurrenciesService.deleteCurrency(Number(this.getParams().id));
		return this.success(null, 'Moneda desactivada exitosamente.');
	}
}

export default new CurrenciesController();
