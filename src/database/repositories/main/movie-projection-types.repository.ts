import { SequelizeRepositoryBase } from '@repositories/bases/sequelize.repository.js';
import MovieProjectionTypesModel from '@database/models/main/movie-projection-types.model.js';

export interface MovieProjectionTypesAttributes {
	id?: number;
	movie: number;
	projection_type: number;
	deleted_at?: Date;
}

class MovieProjectionTypesRepository extends SequelizeRepositoryBase<MovieProjectionTypesAttributes, number> {
	constructor() {
		super(MovieProjectionTypesModel);
	}

	async deleteByMovie(movieId: number, operationOptions?: any): Promise<number> {
		return this.delete({ movie: movieId }, { ...operationOptions, force: true }) as Promise<number>;
	}

	async getByMovie(movieId: number): Promise<MovieProjectionTypesAttributes[]> {
		return this.getAll({ count: false }, { movie: movieId }) as Promise<MovieProjectionTypesAttributes[]>;
	}
}

export default new MovieProjectionTypesRepository();
