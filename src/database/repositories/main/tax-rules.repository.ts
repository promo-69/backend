import { SequelizeRepositoryBase } from '@repositories/bases/sequelize.repository.js';
import TaxRulesModel from '@database/models/main/tax-rules.model.js';

export interface TaxRulesAttributes {
	id?: number;
	tax: number;
	tax_scope: number;
	cinema?: number;
	line_type?: number;
	product_category?: number;
	product?: number;
	combo?: number;
	deleted_at?: Date;
}

class TaxRulesRepository extends SequelizeRepositoryBase<TaxRulesAttributes, number> {
	constructor() {
		super(TaxRulesModel);
	}
}

export default new TaxRulesRepository();
