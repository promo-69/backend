import { ControllerBase } from '@bases/controller.base.js';
import MoviesService from './_.service.js';

class MoviesController extends ControllerBase {
    constructor() {
        super();
    }

    // GET /api/v1/movies
    async findAll() {
        const data = await MoviesService.getBillboard(this.getQueryFilters());
        return data;
    }

    // GET /api/v1/movies/:id
    async findById() {
        const { id } = this.getParams();
        const data = await MoviesService.getMovieDetail(Number(id));
        return this.success(data, 'Película obtenida exitosamente');
    }
}

export default new MoviesController();
