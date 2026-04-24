import { SequelizeRepositoryBase } from '@repositories/bases/sequelize.repository.js';
import RolesModel from '@database/models/main/roles.model.js';

export interface Roles {
	id: number;
	user: number;
	device: string;
	jti: string;
	token_status: number;
	expires_at: Date;
	created_at: Date;
	updated_at: Date;
	status: number;
}

class RolesRepository extends SequelizeRepositoryBase<Roles, number> {
	constructor() {
		super(RolesModel);
	}
}

export default new RolesRepository();
