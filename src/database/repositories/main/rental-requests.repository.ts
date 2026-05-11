import { SequelizeRepositoryBase } from '@repositories/bases/sequelize.repository.js';
import RentalRequestsModel from '@database/models/main/rental-requests.model.js';

export interface RentalRequestsAttributes {
	id?: number;
	event_type: number;
	cinema: number;
	customer?: number;
	contact_name: string;
	contact_email: string;
	contact_phone: string;
	event_date: Date;
	attendees: number;
	created_at?: Date;
	deleted_at?: Date;
}

class RentalRequestsRepository extends SequelizeRepositoryBase<RentalRequestsAttributes, number> {
	constructor() {
		super(RentalRequestsModel);
	}
}

export default new RentalRequestsRepository();
