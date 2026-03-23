import { SequelizeRepositoryBase } from '@repositories/bases/sequelize.repository.js';
import PermissionActionsModel from '@database/models/main/permission-actions.model.js';

export interface PermissionActionsAttributes {
    id?: number;
    code: string;
    description?: string;
    status: number;
}

class PermissionActionsRepository extends SequelizeRepositoryBase<PermissionActionsAttributes, number> {
    constructor() {
        super(PermissionActionsModel);
    }
}

export default new PermissionActionsRepository();
