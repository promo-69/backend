import { SequelizeRepositoryBase } from '@repositories/bases/sequelize.repository.js';
import RentalCateringModel from '@database/models/main/rental-catering.model.js';

export interface RentalCateringAttributes {
	id?: number;
	rental_request: number;
	line_type: number;
	product?: number;
	combo?: number;
	quantity: number;
	original_unit_price?: number;
	unit_price?: number;
	quoted_exchange_rate?: number;
	deleted_at?: Date;
}

class RentalCateringRepository extends SequelizeRepositoryBase<RentalCateringAttributes, number> {
	constructor() {
		super(RentalCateringModel);
	}
}

export default new RentalCateringRepository();
