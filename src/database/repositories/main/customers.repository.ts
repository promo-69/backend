import { SequelizeRepositoryBase } from '@repositories/bases/sequelize.repository.js';
import CustomersModel from '@database/models/main/customers.model.js';

export interface CustomersAttributes {
    id?: number;
    person: number;
    loyalty_level?: number;
    level_progress_points?: number;
    registration_date?: Date;
    deleted_at?: Date;
}

export interface CustomerFull extends CustomersAttributes {
    _People: {
        id: number;
        first_name: string;
        last_name: string;
        personal_email: string;
        phone_number: string;
        document_number: string;
        gender: number | null;
        birth_date: Date | null;
    };
    _LoyaltyLevels: { id: number; name: string };
}

class CustomersRepository extends SequelizeRepositoryBase<CustomersAttributes, number> {
    constructor() {
        super(CustomersModel);
    }

    get relations() {
        return [
            {
                association: '_People',
                attributes: [
                    'id',
                    'document_number',
                    'first_name',
                    'last_name',
                    'gender',
                    'phone_number',
                    'personal_email',
                    'birth_date',
                ],
                required: true,
            },
            {
                association: '_LoyaltyLevels',
                attributes: ['id', 'name'],
                required: false,
            },
        ];
    }

    async getFull(id: number): Promise<CustomerFull | null> {
        return this.getById(id, { relations: this.relations }) as Promise<CustomerFull | null>;
    }
}

export default new CustomersRepository();
