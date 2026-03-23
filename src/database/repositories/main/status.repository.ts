import { SequelizeRepositoryBase } from '@repositories/bases/sequelize.repository.js';
import StatusModel from '@database/models/main/status.model.js';

export interface StatusAttributes {
    id?: any;
    description?: any;
}

class StatusRepository extends SequelizeRepositoryBase<StatusAttributes, number> {
    constructor() {
        super(StatusModel);
    }
}

export default new StatusRepository();
