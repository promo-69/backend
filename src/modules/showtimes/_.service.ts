import ShowtimeManagementService from '@services/showtime-management.service.js';
import { ValidationError } from '@errors';

export class ShowtimesService {
    // Públicos

    async getBillboard(cinemaId?: number) {
        return ShowtimeManagementService.getBillboard(cinemaId);
    }

    async getBillboardFiltered(filters: {
        cinemaId?: number;
        movieId?: number;
        projectionType?: string | number;
        language?: string | number;
    }) {
        return ShowtimeManagementService.getBillboardFiltered(filters);
    }

    async getMovieShowtimesByCinema(movieId: number, cinemaId: number) {
        if (!movieId || !cinemaId) throw new ValidationError('Se requieren movieId y cinemaId');
        return ShowtimeManagementService.getMovieShowtimesByCinema(movieId, cinemaId);
    }

    // Administrativos

    async findAllShowtimes(filters?: any) {
        return ShowtimeManagementService.findAllShowtimes(filters);
    }

    async findShowtimeById(id: number) {
        return ShowtimeManagementService.findShowtimeById(id);
    }

    /**
     * Crea una función (película o evento especial).
     *
     * cinemaId siempre llega ya resuelto desde el controlador:
     *   - Super admin → viene de la URL (/cinemas/:cinemaId)
     *   - Empleado    → viene de su sesión JWT (/cinemas/me)
     *
     * El cinemaId se inyecta en el body para que createShowtime pueda
     * validar que la sala pertenece a esa sucursal.
     */
    async createShowtime(body: any, cinemaId?: number) {
        if (!cinemaId) {
            throw new ValidationError(
                'No se pudo determinar la sucursal. Usá /showtimes/cinemas/:cinemaId o /showtimes/cinemas/me.',
            );
        }
        return ShowtimeManagementService.createShowtime({ ...body, cinemaId });
    }

    async updateShowtime(id: number, body: any) {
        return ShowtimeManagementService.updateShowtime(id, body);
    }

    async deleteShowtime(id: number) {
        return ShowtimeManagementService.deleteShowtime(id);
    }

    async getSeatMap(showtimeId: number) {
        return ShowtimeManagementService.getSeatMap(showtimeId);
    }

    async getUnifiedBillboard(cinemaId?: number) {
        const movies = await ShowtimeManagementService.getBillboard(cinemaId);
        const events = await ShowtimeManagementService.getEventsBillboard(cinemaId);
        const combined = [...movies.rows, ...events.rows].sort((a, b) => {
            const aFirst = a.showtimes?.[0]?.start_time;
            const bFirst = b.showtimes?.[0]?.start_time;
            return new Date(aFirst).getTime() - new Date(bFirst).getTime();
        });
        return { count: combined.length, rows: combined };
    }

    async getAllMoviesByLifecycle(lifecycleState?: number, filters?: any) {
        const where: any = { deleted_at: null };
        if (lifecycleState !== undefined) where.lifecycle_state = lifecycleState;
        const moviesRepo = (await import('@database/index.js')).Database.repository('main', 'movies');
        return moviesRepo.getAll({ ...filters, count: true }, where);
    }

    async getAllShowtimesAdmin(filters?: any) {
        return ShowtimeManagementService.findAllShowtimes(filters);
    }

    async getShowtimesByMovieAdmin(movieId: number, filters?: any) {
        return ShowtimeManagementService.findAllShowtimes({ ...filters, movieId });
    }

    async getShowtimesByEventAdmin(eventId: number, filters?: any) {
        return ShowtimeManagementService.findAllShowtimes({ ...filters, eventId });
    }

    async getShowtimesByCinemaAdmin(cinemaId: number, filters?: any) {
        return ShowtimeManagementService.findAllShowtimes({ ...filters, cinemaId });
    }
}

export default new ShowtimesService();
