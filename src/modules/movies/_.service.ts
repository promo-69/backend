import { BaseService } from '@bases/service.base.js';
import { Database } from '@database/index.js';
import { NotFoundError } from '@errors';
import { type ProcessedQueryFilters } from '@rules/api-query.type.js';

export class MoviesService extends BaseService {
    constructor() {
        super();
    }

    private get _movies() {
        return Database.repository('main', 'movies') as any;
    }

    /**
     * HU-APP-WEB-07 / HU-APP-MOVIL-06
     * Cartelera pública: películas con status=1 (todas las que estén activas).
     * El frontend filtra por lifecycle_state si quiere separar "En Cartelera" de "Próximamente".
     */
    async getBillboard(filters?: ProcessedQueryFilters) {
        return this._movies.getAllOnBillboard(filters);
    }

    /**
     * HU-APP-WEB-08 / HU-APP-MOVIL-07
     * Ficha completa: duración, género, clasificación, sinopsis, tráiler.
     */
    async getMovieDetail(id: number) {
        const movie = await this._movies.getFull(id);
        if (!movie || movie.status !== 1) throw new NotFoundError('Película no encontrada');
        return movie;
    }
}

export default new MoviesService();
