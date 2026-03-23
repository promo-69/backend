import { SequelizeRepositoryBase } from '@repositories/bases/sequelize.repository.js';
import PermissionResourcesModel from '@database/models/main/permission-resources.model.js';

export interface PermissionResourcesAttributes {
    id?: number;
    code: string;
    description?: string;
    status: number;
}

class PermissionResourcesRepository extends SequelizeRepositoryBase<PermissionResourcesAttributes, number> {
    constructor() {
        super(PermissionResourcesModel);
    }
}

export default new PermissionResourcesRepository();
