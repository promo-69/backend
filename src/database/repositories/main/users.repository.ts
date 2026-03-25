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

interface UsersWithPeople extends UsersAttributes {
    _People: {
        first_name: string;
        last_name: string;
        email: string;
        phone_number: string;
    };
}

class UsersRepository extends SequelizeRepositoryBase<UsersAttributes, number> {
    constructor() {
        super(UsersModel);
    }

    getByCredentials(credentials: { username: string; password: string }): Promise<UsersWithPeople | null> {
        return this.getOne(
            { username: credentials.username, password: credentials.password },
            {
                relations: [
                    {
                        association: '_People',
                        attributes: ['first_name', 'last_name', 'email', 'phone_number'],
                        required: true,
                    },
                ],
            },
        ) as Promise<UsersWithPeople | null>;
    }
}

export default new UsersRepository();
