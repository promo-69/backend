import { SequelizeRepositoryBase } from '@repositories/bases/sequelize.repository.js';
import AppliedPriceModifiersModel from '@database/models/main/applied-price-modifiers.model.js';

export interface AppliedPriceModifiersAttributes {
	id?: number;
	price_modifier: number;
	order?: number;
	ticket?: number;
	order_line?: number;
	rental_request?: number;
	rental_catering?: number;
	applied_amount_base_currency: number;
	deleted_at?: Date;
}

class AppliedPriceModifiersRepository extends SequelizeRepositoryBase<AppliedPriceModifiersAttributes, number> {
	constructor() {
		super(AppliedPriceModifiersModel);
	}
}

export default new AppliedPriceModifiersRepository();
