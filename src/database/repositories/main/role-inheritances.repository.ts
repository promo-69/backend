import { SequelizeRepositoryBase } from '@repositories/bases/sequelize.repository.js';
import RoleInheritancesModel from '@database/models/main/role-inheritances.model.js';

export interface RoleInheritancesAttributes {
    id?: number;
    parent_role: number;
    child_role: number;
    deleted_at?: Date;
}

class RoleInheritancesRepository extends SequelizeRepositoryBase<RoleInheritancesAttributes, number> {
    constructor() {
        super(RoleInheritancesModel);
    }
}

export default new RoleInheritancesRepository();
