import { SequelizeRepositoryBase } from '@repositories/bases/sequelize.repository.js';
import PriceModifiersModel from '@database/models/main/price-modifiers.model.js';

export interface PriceModifiersAttributes {
	id?: number;
	description: string;
	operation_type: number;
	is_percentage: boolean;
	value: number;
	currency?: number;
	modifier_scope: number;
	audience_category?: number;
	week_day?: number;
	seat_category?: number;
	projection_type?: number;
	product_category?: number;
	product?: number;
	combo?: number;
	cinema?: number;
	start_date?: Date;
	end_date?: Date;
	start_time?: any;
	end_time?: any;
	line_type?: number;
	target_currency?: number;
	target_currency_condition?: boolean;
	deleted_at?: Date;
}

class PriceModifiersRepository extends SequelizeRepositoryBase<PriceModifiersAttributes, number> {
	constructor() {
		super(PriceModifiersModel);
	}
}

export default new PriceModifiersRepository();
