import { SequelizeRepositoryBase } from '@repositories/bases/sequelize.repository.js';
import BlankTicketsModel from '@database/models/main/blank-tickets.model.js';

export interface BlankTicketsAttributes {
	id?: number;
	code: string;
	reward?: number | null;
	customer: number;
	issue_order: number;
	issued_at?: Date;
	expires_at: Date;
	status?: string;
	redeemed_order?: number | null;
	redeemed_at?: Date | null;
	created_at?: Date;
	updated_at?: Date;
	deleted_at?: Date;
}

class BlankTicketsRepository extends SequelizeRepositoryBase<BlankTicketsAttributes, number> {
	constructor() {
		super(BlankTicketsModel);
	}
}

export default new BlankTicketsRepository();
