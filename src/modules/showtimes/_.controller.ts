import { ControllerBase } from '@bases/controller.base.js';
import ShowtimesService from './_.service.js';

class ShowtimesController extends ControllerBase {
    // Endpoints públicos

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
        const data = await ShowtimesService.findAllShowtimes({
            ...this.getQueryFilters(),
            date: query.date as string | undefined,
            startDate: query.startDate as string | undefined,
            endDate: query.endDate as string | undefined,
            onlyFuture: true,
        });
        return this.success(data, 'Funciones obtenidas exitosamente');
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
}

export default new ShowtimesController();
