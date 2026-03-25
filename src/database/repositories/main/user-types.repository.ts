import { SequelizeRepositoryBase } from '@repositories/bases/sequelize.repository.js';
import UserTypesModel from '@database/models/main/user-types.model.js';

export interface UserTypesAttributes {
    id?: number;
    description: string;
    status: number;
}

class UserTypesRepository extends SequelizeRepositoryBase<UserTypesAttributes, number> {
    constructor() {
        super(UserTypesModel);
    }
}

export default new UserTypesRepository();
