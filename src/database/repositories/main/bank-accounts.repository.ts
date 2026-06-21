import { SequelizeRepositoryBase } from '@database/repositories/bases/sequelize.repository.js';
import BankAccountsModel from '@database/models/main/bank-accounts.model.js';

export interface BankAccountsAttributes {
	id?: number;
	bank: number;
	currency: number;
	payment_method: number;
	payment_details: Array<{ label: string; value: string }>;
	api_key?: string;
	deleted_at?: Date;
}

class BankAccountsRepository extends SequelizeRepositoryBase<BankAccountsAttributes, number> {
	constructor() {
		super(BankAccountsModel as any);
	}
}

export default new BankAccountsRepository();
