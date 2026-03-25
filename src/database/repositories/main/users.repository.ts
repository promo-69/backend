import { SequelizeRepositoryBase } from '@repositories/bases/sequelize.repository.js';
import UsersModel from '@database/models/main/users.model.js';

export interface UsersAttributes {
    id?: number;
    person: number;
    user_type: number;
    role?: number;
    username: string;
    password: string;
    last_login?: Date | string;
    created_at?: Date | string;
    updated_at?: Date | string;
    status: number;
}

class UsersRepository extends SequelizeRepositoryBase<UsersAttributes, number> {
    constructor() {
        super(UsersModel);
    }
}

export default new UsersRepository();
