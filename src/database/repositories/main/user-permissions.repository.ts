import { SequelizeRepositoryBase } from '@repositories/bases/sequelize.repository.js';
import UserPermissionsModel from '@database/models/main/user-permissions.model.js';

export interface UserPermissionsAttributes {
	id?: number;
	user: number;
	permission: number;
	is_granted: boolean;
	deleted_at?: Date;
}

class UserPermissionsRepository extends SequelizeRepositoryBase<UserPermissionsAttributes, number> {
	constructor() {
		super(UserPermissionsModel);
	}
}

export default new UserPermissionsRepository();
