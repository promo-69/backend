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
}

export default new MovieProjectionTypesRepository();
