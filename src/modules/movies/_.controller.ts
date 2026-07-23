import { ControllerBase } from '@bases/controller.base.js';
import MoviesService from './_.service.js';
import { ValidationError } from '@errors';

class MoviesController extends ControllerBase {
	constructor() {
		super();
	}

	//  CATÁLOGO GLOBAL — sin filtro de sucursal

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

	//  POR SUCURSAL — cruza lifecycle con funciones reales de la sucursal

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

	//  DETALLE Y CRUD

	// GET /movies/active — estados 2, 3, 4 con funciones reales (sin cinemaId)
	async activeWithShowtimes() {
		const data = await MoviesService.getActiveWithShowtimes();
		return this.success(data, 'Cartelera activa obtenida exitosamente');
	}

	// GET /movies/by-genre?genres=1,2,3 — películas activas filtradas por género(s)
	async byGenre() {
		const query = this.getQuery();
		const raw = query.genres as string | undefined;
		if (!raw) {
			throw new ValidationError('El parámetro genres es obligatorio', ['genres']);
		}
		const genreIds = raw
			.split(',')
			.map((g: string) => Number(g.trim()))
			.filter((n: number) => !isNaN(n) && n > 0);
		if (genreIds.length === 0) {
			throw new ValidationError('El parámetro genres debe contener al menos un ID numérico válido', ['genres']);
		}
		const data = await MoviesService.getByGenres(genreIds, this.getQueryFilters());
		return this.success(data, 'Películas filtradas por género obtenidas exitosamente');
	}

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

	// POST /movies/:id/last-days
	async markAsLastDays() {
		const { id } = this.getParams();
		const body = this.getBody();
		const daysUntilOut = body?.daysUntilOut !== undefined ? Number(body.daysUntilOut) : 7;
		const data = await MoviesService.markMovieAsLastDays(Number(id), daysUntilOut);
		return this.success(data, 'Película marcada como últimos días y salida de cartelera programada.');
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
