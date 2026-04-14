import { SequelizeRepositoryBase } from '@repositories/bases/sequelize.repository.js';
import ResourcesModel from '@database/models/main/resources.model.js';

export interface ResourcesAttributes {
    id?: number;
    code: string;
    description: string;
    status: number;
}

class ResourcesRepository extends SequelizeRepositoryBase<ResourcesAttributes, number> {
    constructor() {
        super(ResourcesModel);
    }
}

export default new ResourcesRepository();
