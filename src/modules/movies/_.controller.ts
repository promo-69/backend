import { ControllerBase } from '@bases/controller.base.js';
import MoviesService from './_.service.js';

class MoviesController extends ControllerBase {
    constructor() {
        super();
    }

    // GET /api/v1/movies  — HU-APP-WEB-06 cartelera pública
    async findAll() {
        const data = await MoviesService.getBillboard(this.getQueryFilters());
        return data;
    }

    // GET /api/v1/movies/:id  — HU-APP-WEB-07 detalle público
    async findById() {
        const { id } = this.getParams();
        const data = await MoviesService.getMovieDetail(Number(id));
        return this.success(data, 'Película obtenida exitosamente');
    }

    async findInCartelera() {
        const data = await MoviesService.getBillboard(this.getQueryFilters());
        return this.success(data, 'Cartelera obtenida exitosamente');
    }

    // POST /api/v1/movies  — HU-OPERATIVA-12/13 admin
    async create() {
        const body = this.getBody();

        this.requireBodyField('title');
        this.requireBodyField('duration_minutes');
        this.requireBodyField('age_classification');
        this.requireBodyField('lifecycle_state');
        this.requireBodyField('synopsis');
        this.requireBodyField('release_date');
        this.requireBodyField('genres');

        const data = await MoviesService.createMovie(body);
        return this.created(data, 'Película registrada exitosamente en el catálogo.');
    }

    // PUT /api/v1/movies/:id  — HU-OPERATIVA-13 edición admin
    async update() {
        const { id } = this.getParams();
        const body = this.getBody();
        await MoviesService.updateMovie(Number(id), body);
        return this.success(null, 'Datos de la película actualizados exitosamente.');
    }

    // DELETE /api/v1/movies/:id  — HU-OPERATIVA-13 desactivación admin
    async remove() {
        const { id } = this.getParams();
        await MoviesService.deleteMovie(Number(id));
        return this.success(null, 'Película retirada del catálogo exitosamente.');
    }
}

export default new MoviesController();
