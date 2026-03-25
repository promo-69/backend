import { SequelizeRepositoryBase } from '@repositories/bases/sequelize.repository.js';
import ProjectionTypesModel from '@database/models/main/projection-types.model.js';

export interface ProjectionTypesAttributes {
    id?: number;
    description: string;
    status: number;
}

class ProjectionTypesRepository extends SequelizeRepositoryBase<ProjectionTypesAttributes, number> {
    constructor() {
        super(ProjectionTypesModel);
    }
}

export default new ProjectionTypesRepository();
