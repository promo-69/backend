import { SequelizeRepositoryBase } from '@repositories/bases/sequelize.repository.js';
import PeopleModel from '@database/models/main/people.model.js';

export interface PeopleAttributes {
	id?: number;
	document_number: string;
	first_name: string;
	last_name: string;
	gender?: number;
	phone_number?: string;
	personal_email?: string;
	birth_date?: Date | string;
	status: number;
}

class PeopleRepository extends SequelizeRepositoryBase<PeopleAttributes, number> {
	constructor() {
		super(PeopleModel);
	}
}

export default new PeopleRepository();
