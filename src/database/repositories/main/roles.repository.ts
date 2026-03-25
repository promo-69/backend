import { SequelizeRepositoryBase } from '@repositories/bases/sequelize.repository.js';
import RolesModel from '@database/models/main/roles.model.js';

export interface RolesAttributes {
    id?: number;
    code: string;
    description: string;
    status: number;
}

class RolesRepository extends SequelizeRepositoryBase<RolesAttributes, number> {
    constructor() {
        super(RolesModel);
    }
}

export default new RolesRepository();
