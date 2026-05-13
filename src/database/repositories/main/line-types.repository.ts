import { SequelizeRepositoryBase } from '@repositories/bases/sequelize.repository.js';
import LineTypesModel from '@database/models/main/line-types.model.js';

export interface LineTypesAttributes {
	id?: number;
	description: string;
	deleted_at?: Date;
}

class LineTypesRepository extends SequelizeRepositoryBase<LineTypesAttributes, number> {
	constructor() {
		super(LineTypesModel);
	}
}

export default new LineTypesRepository();
