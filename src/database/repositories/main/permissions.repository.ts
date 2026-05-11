import { SequelizeRepositoryBase } from '@repositories/bases/sequelize.repository.js';
import PermissionsModel from '@database/models/main/permissions.model.js';
import { ExceptionPermissions } from '@rules/permission-exceptions.type.js';
import { Ops } from '@database/index.js';

export interface PermissionsAttributes {
    id?: number;
    action: number;
    resource: number;
    permission_type: number;
    deleted_at?: Date;
}

interface PermissionsWithActionsResourcesTypes extends PermissionsAttributes {
    _Actions: {
        code: string;
        description: string;
    };
    _Resources: {
        code: string;
        description: string;
    };
    _PermissionTypes: {
        code: string;
        description: string;
    };
}

class PermissionsRepository extends SequelizeRepositoryBase<PermissionsAttributes, number> {
    constructor() {
        super(PermissionsModel);
    }

    private get _relations() {
        return [
            {
                association: '_Actions',
                attributes: ['code', 'description'],
                required: true,
            },
            {
                association: '_Resources',
                attributes: ['code', 'description'],
                required: true,
            },
            {
                association: '_PermissionTypes',
                attributes: ['code', 'description'],
                required: true,
            },
        ];
    }

    async getByRolesWithExceptions({ roles, exceptions }: { roles: number[]; exceptions: ExceptionPermissions }) {
        return this.getAllActive(
            {
                relations: [
                    {
                        association: '_Actions',
                        attributes: ['code', 'description'],
                        required: true,
                    },
                    {
                        association: '_Resources',
                        attributes: ['code', 'description'],
                        required: true,
                    },
                    {
                        association: '_PermissionTypes',
                        attributes: ['code', 'description'],
                        required: true,
                    },
                    {
                        association: '_RolePermissions',
                        attributes: [],
                        required: false,
                        where: { role: { [Ops.in]: roles } },
                    },
                ],
            },
            {
                [Ops.or]: [
                    {
                        [Ops.and]: [
                            { '$_RolePermissions.role$': { [Ops.in]: roles } },
                            { id: { [Ops.notIn]: exceptions.revoked } },
                        ],
                    },
                    { id: { [Ops.in]: exceptions.granted } },
                ],
            },
        ) as Promise<PermissionsWithActionsResourcesTypes[]>;
    }

    async getFull(id: number): Promise<PermissionsWithActionsResourcesTypes | null> {
        return this.getById(id, { relations: this._relations }) as Promise<PermissionsWithActionsResourcesTypes | null>;
    }

    async getAllFull(filters?: any): Promise<{ rows: PermissionsWithActionsResourcesTypes[]; count: number }> {
        return this.getAllActive({ ...filters, count: true, relations: this._relations }) as Promise<{
            rows: PermissionsWithActionsResourcesTypes[];
            count: number;
        }>;
    }
}

export default new PermissionsRepository();
