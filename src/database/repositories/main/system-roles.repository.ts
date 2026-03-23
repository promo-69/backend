import { SequelizeRepositoryBase, type RelationConfig } from '@repositories/bases/sequelize.repository.js';
import SystemRolesModel from '@database/models/main/system-roles.model.js';
import { type QueryResult } from '@bases/repository.base.js';

export interface SystemRolesAttributes {
    id?: number;
    code: string;
    description: string;
    status: number;
}

class SystemRolesRepository extends SequelizeRepositoryBase<SystemRolesAttributes, number> {
    constructor() {
        super(SystemRolesModel);
    }

    private basicTableAttrs = ['code', 'description'];

    async getAllFull(filters?: any): Promise<QueryResult<SystemRolesAttributes>> {
        const relations: RelationConfig[] = [
            {
                association: '_RolePermissions',
                required: false,
                where: { status: 1 } as any,
                attributes: ['id', 'permission'],
                nested: [
                    {
                        association: '_Permissions',
                        attributes: ['resource', 'action', 'permissionType'],
                        nested: [
                            { association: '_PermissionResources', attributes: this.basicTableAttrs },
                            { association: '_PermissionActions', attributes: this.basicTableAttrs },
                            { association: '_PermissionTypes', attributes: this.basicTableAttrs },
                        ]
                    }
                ]
            }
        ];

        return this.getAllActive({ ...filters, relations, operation: { distinct: true } }, {});
    }

    async getFull(id: number): Promise<SystemRolesAttributes | null> {
        this.validateId(id, true);

        const relations: RelationConfig[] = [
            {
                association: '_RolePermissions',
                required: false,
                where: { status: 1 } as any,
                attributes: ['id', 'permission'],
                nested: [
                    {
                        association: '_Permissions',
                        attributes: ['resource', 'action', 'permissionType'],
                        nested: [
                            { association: '_PermissionResources', attributes: this.basicTableAttrs },
                            { association: '_PermissionActions', attributes: this.basicTableAttrs },
                            { association: '_PermissionTypes', attributes: this.basicTableAttrs },
                        ]
                    }
                ]
            }
        ];

        return this.getOne({ id }, { relations });
    }
}

export default new SystemRolesRepository();
