import { SequelizeRepositoryBase } from '@repositories/bases/sequelize.repository.js';
import ExchangeRatesModel from '@database/models/main/exchange-rates.model.js';

export interface ExchangeRatesAttributes {
	id?: number;
	currency: number;
	rate: number;
	user: number;
	created_at?: Date;
	deleted_at?: Date;
}

class ExchangeRatesRepository extends SequelizeRepositoryBase<ExchangeRatesAttributes, number> {
	constructor() {
		super(ExchangeRatesModel);
	}
}

export default new ExchangeRatesRepository();
