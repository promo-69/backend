import { SequelizeRepositoryBase } from '@repositories/bases/sequelize.repository.js';
import JobPositionsModel from '@database/models/main/job-positions.model.js';

export interface JobPositionsAttributes {
    id?: number;
    name: string;
    description?: string;
    status?: number;
    deleted_at?: Date;
}

class JobPositionsRepository extends SequelizeRepositoryBase<JobPositionsAttributes, number> {
    constructor() {
        super(JobPositionsModel);
    }
}

export default new JobPositionsRepository();
