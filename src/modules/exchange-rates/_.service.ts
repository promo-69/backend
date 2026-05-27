import { BaseService } from '@bases/service.base.js';
import { Database } from '@database/index.js';
import { NotFoundError, ValidationError } from '@errors';
import { type ProcessedQueryFilters } from '@rules/api-query.type.js';
import { WhereOperators } from '@bases/repository.base.js';

export class ExchangeRatesService extends BaseService {
	constructor() {
		super();
	}

	private get _currencies() {
		return Database.repository('main', 'currencies') as any;
	}

	private get _exchangeRates() {
		return Database.repository('main', 'exchange-rates') as any;
	}

	private get _users() {
		return Database.repository('main', 'users') as any;
	}

	private async getCurrencyOrFail(currencyId: number) {
		const currency = await this._currencies.getById(currencyId);
		if (!currency) throw new NotFoundError('Currency not found');
		return currency;
	}

	async listExchangeRates(filters: ProcessedQueryFilters) {
		const relations = [
			{ association: '_Currencies', attributes: ['id', 'code', 'symbol'] },
			{ association: '_Users', attributes: ['id', 'email'] },
		];

		return this._exchangeRates.getAll({ ...filters, relations, order: [['created_at', 'DESC']] });
	}

	async getExchangeRateById(id: number) {
		const exchangeRate = await this._exchangeRates.getById(id, {
			relations: [
				{ association: '_Currencies', attributes: ['id', 'code', 'symbol'] },
				{ association: '_Users', attributes: ['id', 'email'] },
			],
		});

		if (!exchangeRate) throw new NotFoundError('Exchange rate not found');
		return exchangeRate;
	}

	private buildDateFilter(query: Record<string, any>) {
		const dateFilter: Record<string, any> = {};

		if (query.startDate) {
			const start = new Date(String(query.startDate));
			if (Number.isNaN(start.getTime())) throw new ValidationError('startDate must be a valid date');
			dateFilter.created_at = {
				...(dateFilter.created_at ?? {}),
				[WhereOperators.gte]: start.toISOString(),
			};
		}

		if (query.endDate) {
			const end = new Date(String(query.endDate));
			if (Number.isNaN(end.getTime())) throw new ValidationError('endDate must be a valid date');
			dateFilter.created_at = {
				...(dateFilter.created_at ?? {}),
				[WhereOperators.lte]: end.toISOString(),
			};
		}

		return dateFilter;
	}

	async createExchangeRate(body: Record<string, any>, userId?: number) {
		const actorId = Number(userId);
		if (!userId || Number.isNaN(actorId) || actorId <= 0)
			throw new ValidationError('Authenticated user required', ['userId']);

		const currencyId = Number(body.currency);
		const rate = Number(body.rate);

		this.validateRequired({ currency: currencyId, rate }, ['currency', 'rate']);

		if (Number.isNaN(currencyId) || currencyId <= 0)
			throw new ValidationError('currency must be a valid numeric identifier', ['currency']);

		if (Number.isNaN(rate) || rate <= 0)
			throw new ValidationError('rate must be a positive number', ['rate']);

		await this.getCurrencyOrFail(currencyId);

		const created = await this._exchangeRates.create({
			currency: currencyId,
			rate: rate,
			user: actorId,
		});

		return this.getExchangeRateById(created.id);
	}

	async deleteExchangeRate(id: number) {
		const exchangeRate = await this._exchangeRates.getById(id);
		if (!exchangeRate) throw new NotFoundError('Exchange rate not found');

		await this._exchangeRates.delete(id);
	}

	async getExchangeRateHistoryByCurrency(currencyId: number, filters: ProcessedQueryFilters, query: Record<string, any>) {
		await this.getCurrencyOrFail(currencyId);

		const relations = [
			{ association: '_Currencies', attributes: ['id', 'code', 'symbol'] },
			{ association: '_Users', attributes: ['id', 'email'] },
		];

		return this._exchangeRates.getAll(
			{
				...filters,
				relations,
				order: [['created_at', 'DESC']],
			},
			{
				currency: currencyId,
				...this.buildDateFilter(query),
			},
		);
	}
}

export default new ExchangeRatesService();
