import { ControllerBase } from '@bases/controller.base.js';
import ShowtimeManagementService from '@services/showtime-management.service.js';

class CinemaShowtimesController extends ControllerBase {
    // =========================================================================
    // ENDPOINTS PÚBLICOS
    // =========================================================================

    /**
     * GET /cinemas/:cinemaId/showtimes/billboard
     * Cartelera pública de una sucursal.
     * Público — sin autenticación requerida.
     */
    async getBillboardByCinema() {
        const { cinemaId } = this.getParams();
        const data = await ShowtimeManagementService.getBillboard(Number(cinemaId));
        return this.success(data, 'Cartelera de la sucursal obtenida exitosamente');
    }

    /**
     * GET /cinemas/:cinemaId/showtimes/movies/:movieId
     * Funciones de una película en la sucursal con asientos disponibles.
     * Público — sin autenticación requerida.
     */
    async getMovieShowtimes() {
        const { cinemaId, movieId } = this.getParams();
        const data = await ShowtimeManagementService.getMovieShowtimesByCinema(Number(movieId), Number(cinemaId));
        return this.success(data, 'Funciones de la película obtenidas exitosamente');
    }

    /**
     * GET /cinemas/:cinemaId/showtimes
     * Funciones disponibles de una sucursal.
     * Público — sin autenticación requerida.
     *
     * Query params:
     *   ?date=2026-06-15   → solo funciones de ese día
     *   ?date=2026-06-15&tz=America/Bogota → con zona horaria (para uso futuro)
     */
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

    /**
     * GET /cinemas/:cinemaId/showtimes/:id
     * Detalle de una función de la sucursal.
     * Público — sin autenticación requerida.
     */
    async findById() {
        const { id } = this.getParams();
        const data = await ShowtimeManagementService.findShowtimeById(Number(id));
        return this.success(data, 'Función obtenida');
    }

    // =========================================================================
    // ENDPOINTS PRIVADOS (backoffice)
    // =========================================================================

    /**
     * POST /cinemas/:cinemaId/showtimes
     * Crear función en la sucursal (requiere sesión + permiso CRUD:CREATE:CINEMAS-SHOWTIMES).
     */
    async create() {
        const { cinemaId } = this.getParams();
        const body = this.getBody();
        const data = await ShowtimeManagementService.createShowtime({ ...body, cinema: Number(cinemaId) });
        return this.created(data, 'Función programada exitosamente en la sucursal.');
    }
}

export default new CinemaShowtimesController();
