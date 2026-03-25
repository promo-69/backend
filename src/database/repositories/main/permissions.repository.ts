import { SequelizeRepositoryBase } from '@repositories/bases/sequelize.repository.js';
import PermissionsModel from '@database/models/main/permissions.model.js';

export interface PermissionsAttributes {
    id?: number;
    action: number;
    resource: number;
    permission_type: number;
    status: number;
}

class PermissionsRepository extends SequelizeRepositoryBase<PermissionsAttributes, number> {
    constructor() {
        super(PermissionsModel);
    }
}

export default new PermissionsRepository();
