import { SequelizeRepositoryBase } from '@repositories/bases/sequelize.repository.js';
import SeatCategoriesModel from '@database/models/main/seat-categories.model.js';

export interface SeatCategoriesAttributes {
	id?: number;
	description: string;
	deleted_at?: Date;
}

class SeatCategoriesRepository extends SequelizeRepositoryBase<SeatCategoriesAttributes, number> {
	constructor() {
		super(SeatCategoriesModel);
	}
}

export default new SeatCategoriesRepository();
