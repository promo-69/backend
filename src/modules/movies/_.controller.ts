import { ControllerBase } from '@bases/controller.base.js';
import MoviesService from './_.service.js';

class MoviesController extends ControllerBase {
	constructor() {
		super();
	}

<<<<<<< HEAD
	// GET /api/v1/movies  — cartelera pública
=======
	// GET /api/v1/movies  — HU-APP-WEB-06 cartelera pública
>>>>>>> dev
	async findAll() {
		const data = await MoviesService.getMovies(this.getQueryFilters());
		return data;
	}

<<<<<<< HEAD
	// GET /api/v1/movies/showtimes  — películas con funciones activas
=======
	// GET /api/v1/movies/showtimes
>>>>>>> dev
	async findWithShowtimes() {
		const data = await MoviesService.getMoviesWithShowtimes(this.getQueryFilters());
		return data;
	}

<<<<<<< HEAD
	// GET /api/v1/movies/:id  — detalle público
=======
	// GET /api/v1/movies/:id  — HU-APP-WEB-07 detalle público
>>>>>>> dev
	async findById() {
		const { id } = this.getParams();
		const data = await MoviesService.getMovieDetail(Number(id));
		return this.success(data, 'Película obtenida exitosamente');
	}

<<<<<<< HEAD
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
=======
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
>>>>>>> dev
	async remove() {
		const { id } = this.getParams();
		await MoviesService.deleteMovie(Number(id));
		return this.success(null, 'Película retirada del catálogo exitosamente.');
	}
}

export default new MoviesController();
