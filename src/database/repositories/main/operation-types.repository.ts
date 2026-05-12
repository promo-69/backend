import { SequelizeRepositoryBase } from '@repositories/bases/sequelize.repository.js';
import OperationTypesModel from '@database/models/main/operation-types.model.js';

export interface OperationTypesAttributes {
	id?: number;
	description: string;
	is_increment: boolean;
	deleted_at?: Date;
}

class OperationTypesRepository extends SequelizeRepositoryBase<OperationTypesAttributes, number> {
	constructor() {
		super(OperationTypesModel);
	}
}

export default new OperationTypesRepository();
