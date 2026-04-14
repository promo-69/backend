import { SequelizeRepositoryBase } from '@repositories/bases/sequelize.repository.js';
import ActionsModel from '@database/models/main/actions.model.js';

export interface ActionsAttributes {
    id?: number;
    code: string;
    description: string;
    status: number;
}

class ActionsRepository extends SequelizeRepositoryBase<ActionsAttributes, number> {
    constructor() {
        super(ActionsModel);
    }
}

export default new ActionsRepository();
