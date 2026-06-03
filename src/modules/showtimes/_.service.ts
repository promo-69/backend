import ShowtimeManagementService from '@services/showtime-management.service.js';
import { ValidationError } from '@errors';

export class ShowtimesService {
    // --- Endpoints públicos (cartelera) ---

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

    // --- Endpoints internos (backoffice) ---

    async findAllShowtimes(filters?: any) {
        return ShowtimeManagementService.findAllShowtimes(filters);
    }

    async findShowtimeById(id: number) {
        return ShowtimeManagementService.findShowtimeById(id);
    }

    async createShowtime(body: any, sessionCinemaId?: number) {
        const cinemaId = sessionCinemaId ?? body.cinema;
        if (cinemaId === undefined) {
            throw new ValidationError(
                'No se puede determinar la sucursal. Especificá "cinema" en el cuerpo de la petición o iniciá sesión con una sucursal asignada.',
            );
        }
        return ShowtimeManagementService.createShowtime(body);
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

    async getShowtimesByCinemaAdmin(cinemaId: number, filters?: any) {
        return ShowtimeManagementService.findAllShowtimes({ ...filters, cinemaId });
    }
}

export default new ShowtimesService();
