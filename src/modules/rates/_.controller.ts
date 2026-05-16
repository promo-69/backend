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
		return RatesService.createCurrency(body);
	}

	async updateCurrency() {
		const { id } = this.getParams();
		const body = this.getBody();
		return RatesService.updateCurrency(Number(id), body);
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
		return RatesService.createExchangeRate(body, session?.userId);
	}

	async deleteExchangeRate() {
		const { id } = this.getParams();
		await RatesService.deleteExchangeRate(Number(id));
		return this.noContent('Exchange rate deleted successfully');
	}

	async getExchangeRateHistoryByCurrency() {
		const { currencyId } = this.getParams();
		return RatesService.getExchangeRateHistoryByCurrency(Number(currencyId), this.getQueryFilters(), this.getQuery());
	}
}

export default new RatesController();
