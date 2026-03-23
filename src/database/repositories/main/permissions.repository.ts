import { SequelizeRepositoryBase, type RelationConfig } from '@repositories/bases/sequelize.repository.js';
import PermissionsModel from '@database/models/main/permissions.model.js';
import { type QueryResult } from '@bases/repository.base.js';

export interface PermissionsAttributes {
    id?: number;
    resource: number;
    action: number;
    permissionType: number;
    status: number;
}

class PermissionsRepository extends SequelizeRepositoryBase<PermissionsAttributes, number> {
    constructor() {
        super(PermissionsModel);
    }

    private basicTableAttrs = ['code', 'description'];

    async getAllFull(filters?: any): Promise<QueryResult<PermissionsAttributes>> {
        const relations: RelationConfig[] = [
            { association: '_PermissionResources', attributes: this.basicTableAttrs },
            { association: '_PermissionActions', attributes: this.basicTableAttrs },
            { association: '_PermissionTypes', attributes: this.basicTableAttrs },
        ];

        return this.getAllActive({ ...filters, relations }, {});
    }

    async getFull(id: number): Promise<PermissionsAttributes | null> {
        this.validateId(id, true);

        const relations: RelationConfig[] = [
            { association: '_PermissionResources', attributes: this.basicTableAttrs },
            { association: '_PermissionActions', attributes: this.basicTableAttrs },
            { association: '_PermissionTypes', attributes: this.basicTableAttrs },
        ];

        return this.getOne({ id }, { relations });
    }
}

export default new PermissionsRepository();
