import { SequelizeRepositoryBase } from '@repositories/bases/sequelize.repository.js';
import LanguagesModel from '@database/models/main/languages.model.js';

export interface LanguagesAttributes {
	id?: number;
	description: string;
	deleted_at?: Date;
}

class LanguagesRepository extends SequelizeRepositoryBase<LanguagesAttributes, number> {
	constructor() {
		super(LanguagesModel);
	}
}

export default new LanguagesRepository();
