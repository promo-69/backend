import UsersLoginsModel from '@database/models/main/users-logins.model.js';
import { SequelizeRepositoryBase } from '@repositories/bases/sequelize.repository.js';
import UsersLoginModel from '@database/models/main/users-logins.model.js';
export interface UsersLoginsAttributes {
	id?: number;
	user: number;
	device?: string;
	jti: string;
	expires_at: Date;
	created_at?: Date;
	updated_at?: Date;
	deleted_at?: Date;
}

export interface UsersLogin {
	id: number;
	user: number;
	device: string;
	jti: string;
	token_status: number;
	expires_at: Date;
	created_at: Date;
	updated_at: Date;
}

class UsersLoginsRepository extends SequelizeRepositoryBase<UsersLogin, number> {
	constructor() {
		super(UsersLoginModel);
	}
}

export default new UsersLoginsRepository();
