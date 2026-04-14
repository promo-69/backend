import { SequelizeRepositoryBase } from '@repositories/bases/sequelize.repository.js';
import StatusesModel from '@database/models/main/statuses.model.js';

export interface StatusesAttributes {
    id?: number;
    description: string;
}

class StatusesRepository extends SequelizeRepositoryBase<StatusesAttributes, number> {
    constructor() {
        super(StatusesModel);
    }
}

export default new StatusesRepository();
