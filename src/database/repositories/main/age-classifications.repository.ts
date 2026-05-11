import { SequelizeRepositoryBase } from '@repositories/bases/sequelize.repository.js';
import AgeClassificationsModel from '@database/models/main/age-classifications.model.js';

export interface AgeClassificationsAttributes {
	id?: number;
	description: string;
	deleted_at?: Date;
}

class AgeClassificationsRepository extends SequelizeRepositoryBase<AgeClassificationsAttributes, number> {
	constructor() {
		super(AgeClassificationsModel);
	}
}

export default new AgeClassificationsRepository();
