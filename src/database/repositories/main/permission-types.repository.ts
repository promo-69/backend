import { SequelizeRepositoryBase } from '@repositories/bases/sequelize.repository.js';
import PermissionTypesModel from '@database/models/main/permission-types.model.js';

export interface PermissionTypesAttributes {
	id?: number;
	code: string;
	description: string;
	deleted_at?: Date;
}

class PermissionTypesRepository extends SequelizeRepositoryBase<PermissionTypesAttributes, number> {
	constructor() {
		super(PermissionTypesModel);
	}
}

export default new PermissionTypesRepository();
