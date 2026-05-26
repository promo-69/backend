import { ControllerBase } from '@bases/controller.base.js';
import RatesService from './_.service.js';

class RatesController extends ControllerBase {
	constructor() {
		super();
	}

	async listCurrencies() {
		return RatesService.listCurrencies(this.getQueryFilters());
	}

	async getCurrencyById() {
		const { id } = this.getParams();
		return RatesService.getCurrencyById(Number(id));
	}

	async createCurrency() {
		const body = this.getBody();
		const created = await RatesService.createCurrency(body);
		return this.created(created, 'Currency created successfully');
	}

	async updateCurrency() {
		const { id } = this.getParams();
		const body = this.getBody();
		const updated = await RatesService.updateCurrency(Number(id), body);
		return this.updated(updated, 'Currency updated successfully');
	}

	async deleteCurrency() {
		const { id } = this.getParams();
		await RatesService.deleteCurrency(Number(id));
		return this.noContent('Currency deleted successfully');
	}

	async listExchangeRates() {
		return RatesService.listExchangeRates(this.getQueryFilters());
	}

	async getExchangeRateById() {
		const { id } = this.getParams();
		return RatesService.getExchangeRateById(Number(id));
	}

	async createExchangeRate() {
		const body = this.getBody();
		const session = this.getSession<any>();
		const created = await RatesService.createExchangeRate(body, session?.userId);
		return this.created(created, 'Exchange rate created successfully');
	}

	async deleteExchangeRate() {
		const { id } = this.getParams();
		await RatesService.deleteExchangeRate(Number(id));
		return this.noContent('Exchange rate deleted successfully');
	}

	async getExchangeRateHistoryByCurrency() {
		const { currencyId } = this.getParams();
		return RatesService.getExchangeRateHistoryByCurrency(
			Number(currencyId),
			this.getQueryFilters(),
			this.getQuery(),
		);
	}
}

export default new RatesController();
