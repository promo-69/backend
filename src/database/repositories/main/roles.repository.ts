import { SequelizeRepositoryBase } from '@repositories/bases/sequelize.repository.js';
import RolesModel from '@database/models/main/roles.model.js';
export interface RolesAttributes {
	id?: number;
	code: string;
	name: string;
	description: string;
	deleted_at?: Date;
}

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

	async getFull(id: number): Promise<Roles | null> {
		return this.getById(id);
	}

	async getAllFull(filters?: any) {
		return this.getAll({ ...filters, count: true });
	}
}

export default new RolesRepository();
