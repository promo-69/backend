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

	private get _relations() {
		return [
			{
				association: '_RolePermissions',
				required: false,
				nested: [
					{
						association: '_Permissions',
						required: true,
						nested: [
							{ association: '_Actions', attributes: ['code'], required: true },
							{ association: '_Resources', attributes: ['code'], required: true },
							{ association: '_PermissionTypes', attributes: ['code'], required: true },
						],
					},
				],
			},
		];
	}

	async getFull(id: number): Promise<Roles | null> {
		return this.getById(id, { relations: this._relations });
	}

	async getAllFull(filters?: any) {
		const operation = { ...(filters?.operation ?? {}), subQuery: false };
		return this.getAll({ ...filters, count: true, relations: this._relations, operation });
	}
}

export default new RolesRepository();
