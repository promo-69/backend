import { SequelizeRepositoryBase } from '@repositories/bases/sequelize.repository.js';
import EmployeesModel from '@database/models/main/employees.model.js';

export interface EmployeesAttributes {
    id?: number;
    person: number;
    employee_code: string;
    status: number;
}

class EmployeesRepository extends SequelizeRepositoryBase<EmployeesAttributes, number> {
    constructor() {
        super(EmployeesModel);
    }
}

export default new EmployeesRepository();