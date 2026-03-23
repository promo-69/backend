import { SequelizeRepositoryBase } from '@repositories/bases/sequelize.repository.js';
import GendersModel from '@database/models/main/genders.model.js';

export interface GendersAttributes {
    id?: number;
    description: string;
    abbreviation: string;
    status: number;
}

class GendersRepository extends SequelizeRepositoryBase<GendersAttributes, number> {
    constructor() {
        super(GendersModel);
    }
}

export default new GendersRepository();
