import { SequelizeRepositoryBase } from '@repositories/bases/sequelize.repository.js';
import MovieGenresModel from '@database/models/main/movie-genres.model.js';

export interface MovieGenresAttributes {
    id?: number;
    movie: number;
    genre: number;
    status: number;
}

class MovieGenresRepository extends SequelizeRepositoryBase<MovieGenresAttributes, number> {
    constructor() {
        super(MovieGenresModel);
    }
}

export default new MovieGenresRepository();
