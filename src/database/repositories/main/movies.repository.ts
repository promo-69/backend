import { SequelizeRepositoryBase } from '@repositories/bases/sequelize.repository.js';
import MoviesModel from '@database/models/main/movies.model.js';

export interface MovieAttributes {
    id?: number;
    title: string;
    duration_minutes: number;
    age_classification: number;
    lifecycle_state: number;
    synopsis: string;
    trailer_url?: string | null;
    release_date: Date | string;
    status?: number;
}

class MoviesRepository extends SequelizeRepositoryBase<MovieAttributes, number> {
    constructor() {
        super(MoviesModel);
    }
}

export default new MoviesRepository();
