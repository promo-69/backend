import { ControllerBase } from '@bases/controller.base.js';
import ExchangeRatesService from './_.service.js';

class ExchangeRatesController extends ControllerBase {
	constructor() {
		super();
	}

	async listExchangeRates() {
		return ExchangeRatesService.listExchangeRates(this.getQueryFilters());
	}

	async getExchangeRateById() {
		const { id } = this.getParams();
		return ExchangeRatesService.getExchangeRateById(Number(id));
	}

	async createExchangeRate() {
		const body = this.getBody();
		const session = this.getSession<any>();
		return ExchangeRatesService.createExchangeRate(body, session?.userId);
	}

	async deleteExchangeRate() {
		const { id } = this.getParams();
		await ExchangeRatesService.deleteExchangeRate(Number(id));
		return this.noContent('Exchange rate deleted successfully');
	}

	async getExchangeRateHistoryByCurrency() {
		const { currencyId } = this.getParams();
		return ExchangeRatesService.getExchangeRateHistoryByCurrency(Number(currencyId), this.getQueryFilters(), this.getQuery());
	}
}

export default new ExchangeRatesController();
