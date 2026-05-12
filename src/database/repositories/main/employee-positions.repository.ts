import { SequelizeRepositoryBase } from '@repositories/bases/sequelize.repository.js';
import EmployeePositionsModel from '@database/models/main/employee-positions.model.js';

export interface EmployeePositionsAttributes {
	id?: number;
	employee: number;
	job_position: number;
	cinema: number;
	start_date: Date;
	end_date?: Date;
	salary_base?: number;
	deleted_at?: Date;
}

class EmployeePositionsRepository extends SequelizeRepositoryBase<EmployeePositionsAttributes, number> {
	constructor() {
		super(EmployeePositionsModel);
	}
}

export default new EmployeePositionsRepository();
