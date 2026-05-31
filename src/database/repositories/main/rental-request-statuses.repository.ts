import { SequelizeRepositoryBase } from '@repositories/bases/sequelize.repository.js';
import RentalRequestStatusesModel from '@database/models/main/rental-request-statuses.model.js';

export interface RentalRequestStatusesAttributes {
    id?: number;
    description: string;
    deleted_at?: Date;
}

class RentalRequestStatusesRepository extends SequelizeRepositoryBase<RentalRequestStatusesAttributes, number> {
    constructor() {
        super(RentalRequestStatusesModel);
    }
}

export default new RentalRequestStatusesRepository();
