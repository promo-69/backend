import { SequelizeRepositoryBase } from '@repositories/bases/sequelize.repository.js';
import EmployeePositionsModel from '@database/models/main/employee_positions.model.js';

export interface EmployeePositionsAttributes {
    id?: number;
    employee: number;
    job_position: number;
    cinema: number;
    start_date: Date | string;
    end_date?: Date | string;
    salary_base?: number;
    status: number;
}

class EmployeePositionsRepository extends SequelizeRepositoryBase<EmployeePositionsAttributes, number> {
    constructor() {
        super(EmployeePositionsModel);
    }
}

export default new EmployeePositionsRepository();