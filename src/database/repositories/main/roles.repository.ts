import { SequelizeRepositoryBase } from '@repositories/bases/sequelize.repository.js';
import RolesModel from '@database/models/main/roles.model.js';

export interface RolesAttributes {
	id?: number;
	code: string;
	name: string;
	description: string;
	deleted_at?: Date;
}

export interface Roles extends RolesAttributes {
	id: number;
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
