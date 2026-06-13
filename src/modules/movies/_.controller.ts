import { ControllerBase } from '@bases/controller.base.js';
import MoviesService from './_.service.js';

class MoviesController extends ControllerBase {
    constructor() {
        super();
    }

    // GET /api/v1/movies  — HU-APP-WEB-06 cartelera pública
    async findAll() {
        const data = await MoviesService.getMovies(this.getQueryFilters());
        return data;
    }

    // GET /api/v1/movies/showtimes
    async findWithShowtimes() {
        const data = await MoviesService.getMoviesWithShowtimes(this.getQueryFilters());
        return data;
    }

    // GET /api/v1/movies/upcoming  — Películas con lifecycle_state = 1
    async upcoming() {
        const data = await MoviesService.getUpcoming(this.getQueryFilters());
        return this.success(data, 'Películas obtenidas exitosamente');
    }

    // GET /api/v1/movies/premiere  — lifecycle_state = 2 (En Cartelera - Estreno)
    async premiere() {
        const data = await MoviesService.getByLifecycle(2, this.getQueryFilters());
        return this.success(data, 'Películas en estreno obtenidas exitosamente');
    }

    // GET /api/v1/movies/now-playing  — lifecycle_state = 3 (En Cartelera - Regular)
    async nowPlaying() {
        const data = await MoviesService.getByLifecycle(3, this.getQueryFilters());
        return this.success(data, 'Películas en cartelera obtenidas exitosamente');
    }

    // GET /api/v1/movies/last-days  — lifecycle_state = 4 (Últimos Días)
    async lastDays() {
        const data = await MoviesService.getByLifecycle(4, this.getQueryFilters());
        return this.success(data, 'Películas en últimos días obtenidas exitosamente');
    }

    // GET /api/v1/movies/:id  — HU-APP-WEB-07 detalle público
    async findById() {
        const { id } = this.getParams();
        const data = await MoviesService.getMovieDetail(Number(id));
        return this.success(data, 'Película obtenida exitosamente');
    }

    // POST /api/v1/movies  — HU-OPERATIVA-12/13 admin
    async create() {
        const body = this.getBody();
        const req = this.getRequest();

        const data = await MoviesService.createMovie(body, req.files as any);

        return this.created(data, 'Película registrada exitosamente en el catálogo.');
    }

    // PATCH /api/v1/movies/:id  — HU-OPERATIVA-13 edición admin
    async update() {
        const { id } = this.getParams();
        const body = this.getBody();
        const req = this.getRequest();

        const data = await MoviesService.updateMovie(Number(id), body, req.files as any);
        return this.success(data, 'Datos de la película actualizados exitosamente.');
    }

    // DELETE /api/v1/movies/:id  — HU-OPERATIVA-13 desactivación admin
    async remove() {
        const { id } = this.getParams();
        await MoviesService.deleteMovie(Number(id));
        return this.success(null, 'Película retirada del catálogo exitosamente.');
    }
}

export default new MoviesController();
