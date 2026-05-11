import { SequelizeRepositoryBase } from '@repositories/bases/sequelize.repository.js';
import MovieGenresModel from '@database/models/main/movie-genres.model.js';

export interface MovieGenresAttributes {
	id?: number;
	movie: number;
	genre: number;
	deleted_at?: Date;
}

class MovieGenresRepository extends SequelizeRepositoryBase<MovieGenresAttributes, number> {
	constructor() {
		super(MovieGenresModel);
	}

	async deleteByMovie(movieId: number, operationOptions?: any): Promise<number> {
		return this.delete({ movie: movieId }, operationOptions) as Promise<number>;
	}

	async getByMovie(movieId: number): Promise<MovieGenresAttributes[]> {
		return this.getAll({ count: false }, { movie: movieId, status: 1 }) as Promise<MovieGenresAttributes[]>;
	}
}

export default new MovieGenresRepository();
