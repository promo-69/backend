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

	async deleteByMovie(movieId: number, operationOptions?: any): Promise<number> {
		return this.delete({ movie: movieId }, { ...operationOptions, force: true }) as Promise<number>;
	}

	async getByMovie(movieId: number): Promise<MovieLanguagesAttributes[]> {
		return this.getAll({ count: false }, { movie: movieId }) as Promise<MovieLanguagesAttributes[]>;
	}
}

export default new MovieLanguagesRepository();
