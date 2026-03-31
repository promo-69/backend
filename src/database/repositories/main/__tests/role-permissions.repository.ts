import { SequelizeRepositoryBase } from '@repositories/bases/sequelize.repository.js';
import RolePermissionsModel from '@database/models/main/role-permissions.model.js';

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
}

export default new RolePermissionsRepository();
