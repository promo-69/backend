import { ControllerBase } from '@bases/controller.base.js';
import ShowtimesService from './_.service.js';

class ShowtimesController extends ControllerBase {
    // GET /showtimes/billboard - Cartelera global: películas en cartelera con sus funciones futuras.
    async getBillboard() {
        const query = this.getQuery();
        const filters = {
            cinemaId: query.cinemaId ? Number(query.cinemaId) : undefined,
            movieId: query.movieId ? Number(query.movieId) : undefined,
            projectionType: query.projectionType as string | undefined,
            language: query.language as string | undefined,
        };

        // Si no hay filtros avanzados, delegar al método base para mayor rendimiento
        const hasAdvancedFilters = filters.movieId || filters.projectionType || filters.language;
        const data = hasAdvancedFilters
            ? await ShowtimesService.getBillboardFiltered(filters)
            : await ShowtimesService.getBillboard(filters.cinemaId);

        return this.success(data, 'Cartelera obtenida exitosamente');
    }

    // GET /showtimes - Lista de funciones disponibles (futuras por defecto).
    async findAll() {
        const query = this.getQuery();

        // 1. Extraemos y parseamos explícitamente los IDs numéricos del query string
        const movieId = query.movieId ? Number(query.movieId) : undefined;
        const cinemaId = query.cinemaId ? Number(query.cinemaId) : undefined;

        // 2. Enviamos los filtros completos al servicio
        const data = await ShowtimesService.findAllShowtimes({
            ...this.getQueryFilters(),
            date: query.date as string | undefined,
            startDate: query.startDate as string | undefined,
            endDate: query.endDate as string | undefined,
            movieId,
            cinemaId,
            onlyFuture: query.onlyFuture !== 'false',
        });

        let message = 'Funciones obtenidas exitosamente';

        if (data.count === 0) {
            if (movieId) {
                message = 'Esa película no tiene funciones asignadas';
            } else if (cinemaId) {
                message = 'Esta sucursal no tiene funciones programadas';
            } else {
                message = 'No hay funciones disponibles';
            }
        }

        return this.success(data, message);
    }

    // GET /showtimes/:id - Detalle de una función.
    async findById() {
        const { id } = this.getParams();
        const data = await ShowtimesService.findShowtimeById(Number(id));
        return this.success(data, 'Función obtenida');
    }

    // Endpoints privados (backoffice)
    // POST /showtimes - Crear función (requiere sesión + permiso CRUD:CREATE:SHOWTIMES).
    async create() {
        const session = this.getSession<any>();
        const body = this.getBody();
        const data = await ShowtimesService.createShowtime(body, session?.cinemaId);
        return this.created(data, 'Función programada exitosamente.');
    }

    // PATCH /showtimes/:id - Actualizar función (requiere sesión + permiso CRUD:UPDATE:SHOWTIMES).
    async update() {
        const { id } = this.getParams();
        const body = this.getBody();
        await ShowtimesService.updateShowtime(Number(id), body);
        return this.success(null, 'Función actualizada correctamente.');
    }

    // DELETE /showtimes/:id - Cancelar función (requiere sesión + permiso CRUD:DELETE:SHOWTIMES).
    async remove() {
        const { id } = this.getParams();
        await ShowtimesService.deleteShowtime(Number(id));
        return this.success(null, 'Función y reserva de sala canceladas exitosamente.');
    }

    // GET /showtimes/:id/seat-map — Mapa de asientos en tiempo real para una función.
    async getSeatMap() {
        const { id } = this.getParams();
        const data = await ShowtimesService.getSeatMap(Number(id));
        return this.success(data, 'Mapa de asientos obtenido exitosamente.');
    }

    // GET /showtimes/admin/movies?lifecycle=2
    async getAllMoviesByLifecycle() {
        const query = this.getQuery();
        const lifecycle = query.lifecycle ? Number(query.lifecycle) : undefined;
        const data = await ShowtimesService.getAllMoviesByLifecycle(lifecycle, this.getQueryFilters());
        return this.success(data, 'Películas obtenidas exitosamente');
    }

    // GET /showtimes/admin?startDate=...&endDate=...&movieId=...&cinemaId=...
    async getAllShowtimesAdmin() {
        const query = this.getQuery();
        const data = await ShowtimesService.getAllShowtimesAdmin({
            ...this.getQueryFilters(),
            startDate: query.startDate as string,
            endDate: query.endDate as string,
            movieId: query.movieId ? Number(query.movieId) : undefined,
            cinemaId: query.cinemaId ? Number(query.cinemaId) : undefined,
            onlyFuture: query.onlyFuture !== 'false',
        });
        return this.success(data, 'Funciones obtenidas exitosamente');
    }

    // GET /showtimes/admin/movies/:movieId/showtimes
    async getShowtimesByMovieAdmin() {
        const { movieId } = this.getParams();
        const query = this.getQuery();
        const data = await ShowtimesService.getShowtimesByMovieAdmin(Number(movieId), {
            ...this.getQueryFilters(),
            startDate: query.startDate as string,
            endDate: query.endDate as string,
            onlyFuture: query.onlyFuture !== 'false',
        });
        return this.success(data, 'Funciones de la película obtenidas exitosamente');
    }

    // GET /showtimes/admin/cinemas/:cinemaId/showtimes
    async getShowtimesByCinemaAdmin() {
        const { cinemaId } = this.getParams();
        const query = this.getQuery();
        const data = await ShowtimesService.getShowtimesByCinemaAdmin(Number(cinemaId), {
            ...this.getQueryFilters(),
            startDate: query.startDate as string,
            endDate: query.endDate as string,
            onlyFuture: query.onlyFuture !== 'false',
        });
        return this.success(data, 'Funciones de la sucursal obtenidas exitosamente');
    }
}

export default new ShowtimesController();
