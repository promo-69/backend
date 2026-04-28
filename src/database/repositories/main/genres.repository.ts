import { SequelizeRepositoryBase } from '@repositories/bases/sequelize.repository.js';
import GenresModel from '@database/models/main/genres.model.js';

export interface GenresAttributes {
    id?: number;
    description: string;
    status: number;
}

class GenresRepository extends SequelizeRepositoryBase<GenresAttributes, number> {
    constructor() {
        super(GenresModel);
    }
}

export default new GenresRepository();
