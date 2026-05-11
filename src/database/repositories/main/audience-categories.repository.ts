import { SequelizeRepositoryBase } from '@repositories/bases/sequelize.repository.js';
import AudienceCategoriesModel from '@database/models/main/audience-categories.model.js';

export interface AudienceCategoriesAttributes {
    id?: number;
    description: string;
    deleted_at?: Date;
}

class AudienceCategoriesRepository extends SequelizeRepositoryBase<AudienceCategoriesAttributes, number> {
    constructor() {
        super(AudienceCategoriesModel);
    }
}

export default new AudienceCategoriesRepository();
