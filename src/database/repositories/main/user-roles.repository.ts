import { SequelizeRepositoryBase, type RelationConfig } from '@repositories/bases/sequelize.repository.js';
import UserRolesModel from '@database/models/main/user-roles.model.js';
import { type QueryResult } from '@bases/repository.base.js';

export interface UserRolesAttributes {
    id?: number;
    role: number;
    user: number;
    status: number;
}

class UserRolesRepository extends SequelizeRepositoryBase<UserRolesAttributes, number> {
    constructor() {
        super(UserRolesModel);
    }

    async getFullByUser(data: any = {}): Promise<QueryResult<UserRolesAttributes>> {
        this.validateId(data?.id, true);

        const relations: RelationConfig[] = [
            { association: '_SystemAccess' },
            { association: '_SystemRoles', attributes: ['id', 'code'] }
        ];

        return this.getAll(
            { operation: { where: { user: data.id } }, relations },
            {}
        );
    }
}

export default new UserRolesRepository();
