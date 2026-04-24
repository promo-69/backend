import { SequelizeRepositoryBase } from '@repositories/bases/sequelize.repository.js';
import JobPositionsModel from '@database/models/main/job_positions.model.js';

export interface JobPositionsAttributes {
    id?: number;
    title: string;
    description?: string;
    is_pensionable: boolean;
    status: number;
}

class JobPositionsRepository extends SequelizeRepositoryBase<JobPositionsAttributes, number> {
    constructor() {
        super(JobPositionsModel);
    }
}

export default new JobPositionsRepository();