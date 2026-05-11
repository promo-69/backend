import { SequelizeRepositoryBase } from '@repositories/bases/sequelize.repository.js';
import InvoicesModel from '@database/models/main/invoices.model.js';

export interface InvoicesAttributes {
	id?: number;
	order: number;
	invoice_number: string;
	billing_document: string;
	billing_name: string;
	billing_address?: string;
	issued_at?: Date;
	deleted_at?: Date;
}

class InvoicesRepository extends SequelizeRepositoryBase<InvoicesAttributes, number> {
	constructor() {
		super(InvoicesModel);
	}
}

export default new InvoicesRepository();
