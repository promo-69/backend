import { SequelizeRepositoryBase } from '@repositories/bases/sequelize.repository.js';
import MovieLanguagesModel from '@database/models/main/movie-languages.model.js';

export interface MovieLanguagesAttributes {
	id?: number;
	movie: number;
	language: number;
	deleted_at?: Date;
}

class MovieLanguagesRepository extends SequelizeRepositoryBase<MovieLanguagesAttributes, number> {
	constructor() {
		super(MovieLanguagesModel);
	}
}

export default new MovieLanguagesRepository();
