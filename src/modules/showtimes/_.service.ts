import ShowtimeManagementService from '@services/showtime-management.service.js';
import { ValidationError } from '@errors';
import { Database } from '@database/index.js';

export class ShowtimesService {
    async getBillboard(cinemaId?: number) {
        return ShowtimeManagementService.getBillboard(cinemaId ? { cinemaId } : undefined);
    }

    async getBillboardFiltered(filters: {
        cinemaId?: number;
        movieId?: number;
        projectionType?: string | number;
        language?: string | number;
    }) {
        return ShowtimeManagementService.getBillboardFiltered(filters);
    }

    async getMovieShowtimesByCinema(movieId: number, cinemaId: number, userId?: number) {
        if (!movieId || !cinemaId) throw new ValidationError('Se requieren movieId y cinemaId');
        return ShowtimeManagementService.getMovieShowtimesByCinema(movieId, cinemaId, userId);
    }

    // Cartelera activa unificada: películas + eventos en lifecycle 2, 3 y 4 con funciones futuras.
    // cinemaId opcional — si se omite devuelve la cartelera global, si se pasa filtra por sucursal.
    async getFullActiveBillboard(cinemaId?: number) {
        return ShowtimeManagementService.getFullActiveBillboard(cinemaId);
    }

    async findAllShowtimes(filters?: any) {
        return ShowtimeManagementService.findAllShowtimes(filters);
    }

    async findShowtimeById(id: number) {
        return ShowtimeManagementService.findShowtimeById(id);
    }

    async createShowtime(body: any, sessionCinemaId?: number) {
        const cinemaId = sessionCinemaId ?? body.cinema;
        if (cinemaId === undefined)
            throw new ValidationError(
                'No se puede determinar la sucursal. Especificá "cinema" en el cuerpo de la petición o iniciá sesión con una sucursal asignada.',
            );
        return ShowtimeManagementService.createShowtime(body);
    }

    async bulkCreateShowtimes(body: any) {
        return ShowtimeManagementService.bulkCreateShowtimes(body);
    }

    async updateShowtime(id: number, body: any) {
        return ShowtimeManagementService.updateShowtime(id, body);
    }

    async deleteShowtime(id: number) {
        return ShowtimeManagementService.deleteShowtime(id);
    }

    async getSeatMap(showtimeId: number, userId?: number) {
        return ShowtimeManagementService.getSeatMap(showtimeId, userId);
    }

    async getSeatsStatus(showtimeId: number) {
        return ShowtimeManagementService.getSeatsStatus(showtimeId);
    }

    async getUnifiedBillboard(cinemaId?: number) {
        const movies = await ShowtimeManagementService.getBillboard(cinemaId ? { cinemaId } : undefined);
        const events = await ShowtimeManagementService.getEventsBillboard(cinemaId);
        const combined = [...movies.rows, ...events.rows].sort((a, b) => {
            const aFirst = a.showtimes?.[0]?.booking?.start_time;
            const bFirst = b.showtimes?.[0]?.booking?.start_time;
            return new Date(aFirst).getTime() - new Date(bFirst).getTime();
        });
        return { count: combined.length, rows: combined };
    }

    async getAllMoviesByLifecycle(lifecycleState?: number, filters?: any) {
        const where: any = { deleted_at: null };
        if (lifecycleState !== undefined) where.lifecycle_state = lifecycleState;
        const moviesRepo = Database.repository('main', 'movies') as any;
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
