import { ControllerBase } from '@bases/controller.base.js';
import ShowtimeManagementService from '@services/showtime-management.service.js';

class CinemaShowtimesController extends ControllerBase {
    // GET /cinemas/:cinemaId/showtimes/billboard
    async getBillboardByCinema() {
        const { cinemaId } = this.getParams();
        const query = this.getQuery();
        const filters = {
            cinemaId: Number(cinemaId),
            movieId: query.movieId ? Number(query.movieId) : undefined,
            projectionType: query.projectionType as string | undefined,
            language: query.language as string | undefined,
        };
        const hasAdvancedFilters = filters.movieId || filters.projectionType || filters.language;
        const data = hasAdvancedFilters
            ? await ShowtimeManagementService.getBillboardFiltered(filters)
            : await ShowtimeManagementService.getBillboard(filters.cinemaId);

        if (data.count === 0) {
            try {
                const cinemasRepo = (await import('@database/index.js')).Database.repository('main', 'cinemas') as any;
                const cinema = await cinemasRepo.getById(filters.cinemaId);
                if (cinema) {
                    return this.success(data, `No hay funciones disponibles en la sucursal ${cinema.name}`);
                }
            } catch {
                /* */
            }
            return this.success(data, 'No hay funciones disponibles en esta sucursal');
        }
        return this.success(data, 'Cartelera de la sucursal obtenida exitosamente');
    }

    // GET /cinemas/:cinemaId/showtimes/movies/:movieId
    async getMovieShowtimes() {
        const { cinemaId, movieId } = this.getParams();
        const data = await ShowtimeManagementService.getMovieShowtimesByCinema(Number(movieId), Number(cinemaId));
        return this.success(data, 'Funciones de la película obtenidas exitosamente');
    }

    // GET /cinemas/:cinemaId/showtimes
    async findAll() {
        const { cinemaId } = this.getParams();
        const query = this.getQuery();
        const data = await ShowtimeManagementService.findAllShowtimes({
            ...this.getQueryFilters(),
            cinemaId: Number(cinemaId),
            date: query.date as string | undefined,
            startDate: query.startDate as string | undefined,
            endDate: query.endDate as string | undefined,
            onlyFuture: query.date || query.startDate ? false : true,
        });
        return this.success(data, 'Funciones de la sucursal obtenidas exitosamente');
    }

    // GET /cinemas/:cinemaId/showtimes/:id
    async findById() {
        const { id } = this.getParams();
        const data = await ShowtimeManagementService.findShowtimeById(Number(id));
        return this.success(data, 'Función obtenida');
    }

    // GET /cinemas/:cinemaId/showtimes/:id/seat-map
    async getSeatMap() {
        const { id } = this.getParams();
        const data = await ShowtimeManagementService.getSeatMap(Number(id));
        return this.success(data, 'Mapa de asientos obtenido exitosamente');
    }

    // POST /cinemas/:cinemaId/showtimes
    async create() {
        const { cinemaId } = this.getParams();
        const body = this.getBody();
        // Inyectamos el cinemaId en el body para que el servicio lo valide
        const data = await ShowtimeManagementService.createShowtime({ ...body, cinemaId: Number(cinemaId) });
        return this.created(data, 'Función programada exitosamente en la sucursal.');
    }
}

export default new CinemaShowtimesController();
