import { SequelizeRepositoryBase, type RelationConfig } from '@repositories/bases/sequelize.repository.js';
import RolePermissionsModel from '@database/models/main/role-permissions.model.js';
import { type QueryResult } from '@bases/repository.base.js';

export interface RolePermissionsAttributes {
    id?: number;
    role: number;
    permission: number;
    status: number;
}

class RolePermissionsRepository extends SequelizeRepositoryBase<RolePermissionsAttributes, number> {
    constructor() {
        super(RolePermissionsModel);
    }

    private basicTableAttrs: string[] = ['code', 'description'];

    async getAllFull(filters?: any): Promise<QueryResult<RolePermissionsAttributes>> {
        const relations: RelationConfig[] = [
            { association: '_SystemRoles', required: true, attributes: this.basicTableAttrs },
            {
                association: '_Permissions',
                attributes: ['resource', 'action', 'permissionType'],
                nested: [
                    { association: '_PermissionResources', attributes: this.basicTableAttrs },
                    { association: '_PermissionActions', attributes: this.basicTableAttrs },
                    { association: '_PermissionTypes', attributes: this.basicTableAttrs },
                ]
            }
        ];

        return this.getAllActive({ ...filters, relations }, {});
    }

    async getFullByRole({ roleId }: { roleId?: number } = {}): Promise<QueryResult<RolePermissionsAttributes>> {
        if (roleId == null) throw new Error('No se proporcionó el código del rol para la búsqueda de permisos');

        const relations: RelationConfig[] = [
            { 
               association: '_SystemRoles', 
               required: true, 
               where: { id: roleId } as any,
               attributes: this.basicTableAttrs 
            },
            {
                association: '_Permissions',
                attributes: ['resource', 'action', 'permissionType'],
                nested: [
                    { association: '_PermissionResources', attributes: this.basicTableAttrs },
                    { association: '_PermissionActions', attributes: this.basicTableAttrs },
                    { association: '_PermissionTypes', attributes: this.basicTableAttrs },
                ]
            }
        ];

        return this.getAllActive({ relations }, {});
    }
}

export default new RolePermissionsRepository();
