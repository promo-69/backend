import ShowtimeManagementService from '@services/showtime-management.service.js';
import { ValidationError } from '@errors';

export class ShowtimesService {
    async findAllShowtimes(filters?: any) {
        return ShowtimeManagementService.findAllShowtimes(filters);
    }

    async findShowtimeById(id: number) {
        return ShowtimeManagementService.findShowtimeById(id);
    }

    async createShowtime(body: any, cinemaId?: number) {
        if (cinemaId === undefined) {
            throw new ValidationError(
                'No se puede determinar la sucursal. Usa el endpoint explícito /cinemas/:cinemaId/showtimes para programar funciones como administrador.',
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
