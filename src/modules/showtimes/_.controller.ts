import { ControllerBase } from '@bases/controller.base.js';
import ShowtimesService from './_.service.js';

class ShowtimesController extends ControllerBase {

    // =========================================================================
    //  PÚBLICOS
    // =========================================================================

    async getBillboard() {
        const query = this.getQuery();
        const filters = {
            cinemaId: query.cinemaId ? Number(query.cinemaId) : undefined,
            movieId: query.movieId ? Number(query.movieId) : undefined,
            projectionType: query.projectionType as string | undefined,
            language: query.language as string | undefined,
        };
        const hasAdvancedFilters = filters.movieId || filters.projectionType || filters.language;
        const data = hasAdvancedFilters
            ? await ShowtimesService.getBillboardFiltered(filters)
            : await ShowtimesService.getBillboard(filters.cinemaId);
        return this.success(data, 'Cartelera obtenida exitosamente');
    }

    async getUnifiedBillboard() {
        const query = this.getQuery();
        const cinemaId = query.cinemaId ? Number(query.cinemaId) : undefined;
        const data = await ShowtimesService.getUnifiedBillboard(cinemaId);
        return this.success(data, 'Cartelera unificada obtenida exitosamente');
    }

    async findAll() {
        const query = this.getQuery();
        const movieId = query.movieId ? Number(query.movieId) : undefined;
        const cinemaId = query.cinemaId ? Number(query.cinemaId) : undefined;
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
            if (movieId) message = 'Esa película no tiene funciones asignadas';
            else if (cinemaId) message = 'Esta sucursal no tiene funciones programadas';
            else message = 'No hay funciones disponibles';
        }
        return this.success(data, message);
    }

    async findById() {
        const { id } = this.getParams();
        const data = await ShowtimesService.findShowtimeById(Number(id));
        return this.success(data, 'Función obtenida');
    }

    async getSeatMap() {
        const { id } = this.getParams();
        const data = await ShowtimesService.getSeatMap(Number(id));
        return this.success(data, 'Mapa de asientos obtenido exitosamente.');
    }

    // =========================================================================
    //  ADMINISTRATIVOS (solo consultas, no creación)
    // =========================================================================

    async getAllMoviesByLifecycle() {
        const query = this.getQuery();
        const lifecycle = query.lifecycle ? Number(query.lifecycle) : undefined;
        const data = await ShowtimesService.getAllMoviesByLifecycle(lifecycle, this.getQueryFilters());
        return this.success(data, 'Películas obtenidas exitosamente');
    }

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

    async getShowtimesByEventAdmin() {
        const { eventId } = this.getParams();
        const query = this.getQuery();
        const data = await ShowtimesService.getShowtimesByEventAdmin(Number(eventId), {
            ...this.getQueryFilters(),
            startDate: query.startDate as string,
            endDate: query.endDate as string,
            onlyFuture: query.onlyFuture !== 'false',
        });
        return this.success(data, 'Funciones del evento obtenidas exitosamente');
    }

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

    // PATCH /showtimes/:id
    async update() {
        const { id } = this.getParams();
        const body = this.getBody();
        await ShowtimesService.updateShowtime(Number(id), body);
        return this.success(null, 'Función actualizada correctamente.');
    }

    // DELETE /showtimes/:id
    async remove() {
        const { id } = this.getParams();
        await ShowtimesService.deleteShowtime(Number(id));
        return this.success(null, 'Función y reserva de sala canceladas exitosamente.');
    }
}

export default new ShowtimesController();
