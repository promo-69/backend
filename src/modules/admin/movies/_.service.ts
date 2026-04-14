import { BaseService } from '@bases/service.base.js';
import { Database } from '@database/index.js';
import { WhereOperators } from '@bases/repository.base.js';

export class MoviesService extends BaseService {
    constructor() {
        super();
    }

    private get _movies() {
        return Database.repository('main', 'movies') as any;
    }

    async findAllMovies(filters?: any) {
        return this._movies.getAll(filters || {});
    }

    async findMoviesInCartelera(filters?: any) {
        const carteleraFilters = {
            ...filters,
            conditions: {
                ...filters?.conditions,
                lifecycle_state: { [WhereOperators.in]: [1, 2, 3] }
            }
        };
        return this._movies.getAll(carteleraFilters);
    }

    async findMovieById(id: number) {
        return this._movies.getById(id);
    }

    async createMovie(movieData: any) {
        return this._movies.create(movieData);
    }

    async updateMovie(id: number, movieData: any) {
        return this._movies.update(id, movieData);
    }

    async deleteMovie(id: number) {
        return this._movies.update(id, { status: 0 });
    }
}

export default new MoviesService();
