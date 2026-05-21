import { SequelizeRepositoryBase } from '@repositories/bases/sequelize.repository.js';
import CustomersModel from '@database/models/main/customers.model.js';

export interface CustomersAttributes {
    id?: number;
    person: number;
    loyalty_level?: number;
    level_progress_points?: number;
    current_points_balance?: number; // columna real en la migración
    registration_date?: Date;
    deleted_at?: Date;
}

export interface CustomerFull extends CustomersAttributes {
    _People: {
        first_name: string;
        last_name: string;
        personal_email: string;
        phone_number: string;
    };
    _LoyaltyLevels: { name: string }; // loyalty_levels tiene 'name', no 'description'
}

class CustomersRepository extends SequelizeRepositoryBase<CustomersAttributes, number> {
    constructor() {
        super(CustomersModel);
    }

    private get _relations() {
        return [
            {
                association: '_People',
                attributes: ['id', 'document_number', 'first_name', 'last_name', 'personal_email', 'phone_number'],
                required: true,
            },
            {
                association: '_LoyaltyLevels',
                attributes: ['id', 'name'], // 'name' según la migración
                required: false,
            },
        ];
    }

    async getFull(id: number): Promise<CustomerFull | null> {
        return this.getOne({ id }, { relations: this._relations }) as Promise<CustomerFull | null>;
    }
}

export default new CustomersRepository();
