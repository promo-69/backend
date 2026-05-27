import { ControllerBase } from '@bases/controller.base.js';
import MoviesService from './_.service.js';

class MoviesController extends ControllerBase {
	constructor() {
		super();
	}

	// GET /api/v1/movies  — cartelera pública
	async findAll() {
		const data = await MoviesService.getMovies(this.getQueryFilters());
		return data;
	}

	// GET /api/v1/movies/showtimes  — películas con funciones activas
	async findWithShowtimes() {
		const data = await MoviesService.getMoviesWithShowtimes(this.getQueryFilters());
		return data;
	}

	// GET /api/v1/movies/:id  — detalle público
	async findById() {
		const { id } = this.getParams();
		const data = await MoviesService.getMovieDetail(Number(id));
		return this.success(data, 'Película obtenida exitosamente');
	}

	// POST /api/v1/movies  — admin
	async create() {
		const body = this.getBody();
		const req = this.getRequest();
		const data = await MoviesService.createMovie(body, req.files as any);
		return this.created(data, 'Película registrada exitosamente en el catálogo.');
	}

	// PATCH /api/v1/movies/:id  — admin
	async update() {
		const { id } = this.getParams();
		const body = this.getBody();
		const req = this.getRequest();
		const data = await MoviesService.updateMovie(Number(id), body, req.files as any);
		return this.success(data, 'Datos de la película actualizados exitosamente.');
	}

	// DELETE /api/v1/movies/:id  — admin
	async remove() {
		const { id } = this.getParams();
		await MoviesService.deleteMovie(Number(id));
		return this.success(null, 'Película retirada del catálogo exitosamente.');
	}
}

export default new MoviesController();
