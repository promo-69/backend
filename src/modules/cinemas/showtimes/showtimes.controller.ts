import { ControllerBase } from '@bases/controller.base.js';
import ShowtimeManagementService from '@services/showtime-management.service.js';

class CinemaShowtimesController extends ControllerBase {
    // Endpoints públicos
    // GET /cinemas/:cinemaId/showtimes/billboard
    // Cartelera pública de una sucursal con filtros opcionales.
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

        return this.success(data, 'Cartelera de la sucursal obtenida exitosamente');
    }

    // GET /cinemas/:cinemaId/showtimes/movies/:movieId
    // Funciones de una película en la sucursal con asientos disponibles.
    async getMovieShowtimes() {
        const { cinemaId, movieId } = this.getParams();
        const data = await ShowtimeManagementService.getMovieShowtimesByCinema(Number(movieId), Number(cinemaId));
        return this.success(data, 'Funciones de la película obtenidas exitosamente');
    }

    // GET /cinemas/:cinemaId/showtimes
    // Funciones disponibles de una sucursal.
    async findAll() {
        const { cinemaId } = this.getParams();
        const query = this.getQuery();
        const data = await ShowtimeManagementService.findAllShowtimes({
            ...this.getQueryFilters(),
            cinemaId: Number(cinemaId),
            date: query.date as string | undefined,
            onlyFuture: true,
        });
        return this.success(data, 'Funciones de la sucursal obtenidas exitosamente');
    }

    // GET /cinemas/:cinemaId/showtimes/:id
    // Detalle de una función de la sucursal.
    async findById() {
        const { id } = this.getParams();
        const data = await ShowtimeManagementService.findShowtimeById(Number(id));
        return this.success(data, 'Función obtenida');
    }

    // Endpoints privados (backoffice)

    // POST /cinemas/:cinemaId/showtimes
    // Crear función en la sucursal (requiere sesión + permiso CRUD:CREATE:CINEMAS-SHOWTIMES).
    async create() {
        const { cinemaId } = this.getParams();
        const body = this.getBody();
        const data = await ShowtimeManagementService.createShowtime({ ...body, cinema: Number(cinemaId) });
        return this.created(data, 'Función programada exitosamente en la sucursal.');
    }

    // GET /cinemas/:cinemaId/showtimes/:id/seat-map
    // Mapa de asientos en tiempo real para una función de esta sucursal.
    async getSeatMap() {
        const { id } = this.getParams();
        const data = await ShowtimeManagementService.getSeatMap(Number(id));
        return this.success(data, 'Mapa de asientos obtenido exitosamente.');
    }
}

export default new CinemaShowtimesController();
