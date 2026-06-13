import { ControllerBase } from '@bases/controller.base.js';
import MoviesService from './_.service.js';

class MoviesController extends ControllerBase {
    constructor() {
        super();
    }

    // =========================================================================
    //  CATÁLOGO GLOBAL — sin filtro de sucursal
    // =========================================================================

    // GET /movies
    async findAll() {
        const data = await MoviesService.getMovies(this.getQueryFilters());
        return data;
    }

    // GET /movies/showtimes
    async findWithShowtimes() {
        const data = await MoviesService.getMoviesWithShowtimes(this.getQueryFilters());
        return data;
    }

    // GET /movies/upcoming — lifecycle_state = 1 (catálogo global)
    async upcoming() {
        const data = await MoviesService.getUpcoming(this.getQueryFilters());
        return this.success(data, 'Películas obtenidas exitosamente');
    }

    // GET /movies/premiere — lifecycle_state = 2 (catálogo global)
    async premiere() {
        const data = await MoviesService.getByLifecycle(2, this.getQueryFilters());
        return this.success(data, 'Películas en estreno obtenidas exitosamente');
    }

    // GET /movies/now-playing — lifecycle_state = 3 (catálogo global)
    async nowPlaying() {
        const data = await MoviesService.getByLifecycle(3, this.getQueryFilters());
        return this.success(data, 'Películas en cartelera obtenidas exitosamente');
    }

    // GET /movies/last-days — lifecycle_state = 4 (catálogo global)
    async lastDays() {
        const data = await MoviesService.getByLifecycle(4, this.getQueryFilters());
        return this.success(data, 'Películas en últimos días obtenidas exitosamente');
    }

    // =========================================================================
    //  POR SUCURSAL — cruza lifecycle con funciones reales de la sucursal
    // =========================================================================

    // GET /movies/by-cinema/:cinemaId/upcoming
    async upcomingByCinema() {
        const { cinemaId } = this.getParams();
        const data = await MoviesService.getUpcomingByCinema(Number(cinemaId), this.getQueryFilters());
        return this.success(data, 'Películas próximas obtenidas exitosamente');
    }

    // GET /movies/by-cinema/:cinemaId/premiere
    async premiereByCinema() {
        const { cinemaId } = this.getParams();
        const data = await MoviesService.getOnPremiereByCinema(Number(cinemaId));
        return this.success(data, 'Películas en estreno obtenidas exitosamente');
    }

    // GET /movies/by-cinema/:cinemaId/now-playing
    async nowPlayingByCinema() {
        const { cinemaId } = this.getParams();
        const data = await MoviesService.getInBillboardByCinema(Number(cinemaId));
        return this.success(data, 'Películas en cartelera obtenidas exitosamente');
    }

    // GET /movies/by-cinema/:cinemaId/last-days
    async lastDaysByCinema() {
        const { cinemaId } = this.getParams();
        const data = await MoviesService.getLastDaysByCinema(Number(cinemaId));
        return this.success(data, 'Películas en últimos días obtenidas exitosamente');
    }

    // =========================================================================
    //  DETALLE Y CRUD
    // =========================================================================

    // GET /movies/:id
    async findById() {
        const { id } = this.getParams();
        const data = await MoviesService.getMovieDetail(Number(id));
        return this.success(data, 'Película obtenida exitosamente');
    }

    // POST /movies
    async create() {
        const body = this.getBody();
        const req = this.getRequest();
        const data = await MoviesService.createMovie(body, req.files as any);
        return this.created(data, 'Película registrada exitosamente en el catálogo.');
    }

    // PATCH /movies/:id
    async update() {
        const { id } = this.getParams();
        const body = this.getBody();
        const req = this.getRequest();
        const data = await MoviesService.updateMovie(Number(id), body, req.files as any);
        return this.success(data, 'Datos de la película actualizados exitosamente.');
    }

    // DELETE /movies/:id
    async remove() {
        const { id } = this.getParams();
        await MoviesService.deleteMovie(Number(id));
        return this.success(null, 'Película retirada del catálogo exitosamente.');
    }
}

export default new MoviesController();
