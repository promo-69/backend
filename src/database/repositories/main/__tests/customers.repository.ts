import { SequelizeRepositoryBase } from '@repositories/bases/sequelize.repository.js';
import CustomersModel from '@database/models/main/customers.model.js';

export interface CustomersAttributes {
    id?: number;
    person: number;
    registration_date: Date | string;
    status: number;
}

class CustomersRepository extends SequelizeRepositoryBase<CustomersAttributes, number> {
    constructor() {
        super(CustomersModel);
    }
}

export default new CustomersRepository();
