import { ControllerBase } from '@bases/controller.base.js';
import ShowtimeManagementService from '@services/showtime-management.service.js';

class CinemaShowtimesController extends ControllerBase {
    async findAll() {
        const { cinemaId } = this.getParams();
        const data = await ShowtimeManagementService.findAllShowtimes({
            ...this.getQueryFilters(),
            cinemaId: Number(cinemaId),
        });
        return data;
    }

    async create() {
        const body = this.getBody();
        const data = await ShowtimeManagementService.createShowtime(body);
        return this.created(data, 'Función programada exitosamente en la sede remota.');
    }
}

export default new CinemaShowtimesController();
