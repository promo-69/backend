import ShowtimeManagementService from '@services/showtime-management.service.js';
import { ValidationError } from '@errors';

export class ShowtimesService {
    // --- Endpoints públicos (cartelera) ---

    async getBillboard(cinemaId?: number) {
        return ShowtimeManagementService.getBillboard(cinemaId);
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
}

export default new ShowtimesService();
