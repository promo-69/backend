import { SequelizeRepositoryBase } from '@repositories/bases/sequelize.repository.js';
import CustomersModel from '@database/models/main/customers.model.js';

export interface CustomersAttributes {
    id?: number;
    person: number;
    loyalty_level?: number;
    level_progress_points?: number;
    current_points_balance?: number;
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
	_LoyaltyLevel: { description: string };
	_Status: { description: string };
}

class CustomersRepository extends SequelizeRepositoryBase<CustomersAttributes, number> {
	constructor() {
		super(CustomersModel);
	}

	private get _relations() {
		return [
			{
				association: '_People',
				attributes: ['first_name', 'last_name', 'personal_email', 'phone_number'],
				required: true,
			},
			{
				association: '_LoyaltyLevel',
				attributes: ['description'],
				required: false,
			},
			{
				association: '_Status',
				attributes: ['description'],
				required: true,
			},
		];
	}

	async getFull(id: number): Promise<CustomerFull | null> {
		return this.getOne({ id }, { relations: this._relations }) as Promise<CustomerFull | null>;
	}
}

export default new CustomersRepository();
