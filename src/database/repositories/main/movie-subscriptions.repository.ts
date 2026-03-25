import { SequelizeRepositoryBase } from '@repositories/bases/sequelize.repository.js';
import MovieSubscriptionsModel from '@database/models/main/movie-subscriptions.model.js';

export interface MovieSubscriptionsAttributes {
    id?: number;
    customer: number;
    movie: number;
    is_notified: boolean;
    created_at?: Date | string;
    status: number;
}

class MovieSubscriptionsRepository extends SequelizeRepositoryBase<MovieSubscriptionsAttributes, number> {
    constructor() {
        super(MovieSubscriptionsModel);
    }
}

export default new MovieSubscriptionsRepository();
