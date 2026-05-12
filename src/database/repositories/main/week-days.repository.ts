import { SequelizeRepositoryBase } from '@repositories/bases/sequelize.repository.js';
import WeekDaysModel from '@database/models/main/week-days.model.js';

export interface WeekDaysAttributes {
	id?: number;
	description: string;
	day_number: number;
	deleted_at?: Date;
}

class WeekDaysRepository extends SequelizeRepositoryBase<WeekDaysAttributes, number> {
	constructor() {
		super(WeekDaysModel);
	}
}

export default new WeekDaysRepository();
