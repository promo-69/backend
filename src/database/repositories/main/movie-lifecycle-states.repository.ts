import { SequelizeRepositoryBase } from '@repositories/bases/sequelize.repository.js';
import MovieLifecycleStatesModel from '@database/models/main/movie-lifecycle-states.model.js';

export interface MovieLifecycleStatesAttributes {
	id?: number;
	description: string;
	deleted_at?: Date;
}

class MovieLifecycleStatesRepository extends SequelizeRepositoryBase<MovieLifecycleStatesAttributes, number> {
	constructor() {
		super(MovieLifecycleStatesModel);
	}
}

export default new MovieLifecycleStatesRepository();
