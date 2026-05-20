import { SequelizeRepositoryBase } from '@repositories/bases/sequelize.repository.js';
import MovieUserSubscriptionsModel from '@database/models/main/movie-user-subscriptions.model.js';

export interface MovieUserSubscriptionsAttributes {
	id?: number;
	customer: number;
	movie: number;
	is_notified: boolean;
	created_at: Date;
	deleted_at?: Date;
}

class MovieUserSubscriptionsRepository extends SequelizeRepositoryBase<MovieUserSubscriptionsAttributes, number> {
	constructor() {
		super(MovieUserSubscriptionsModel);
	}
}

export default new MovieUserSubscriptionsRepository();
