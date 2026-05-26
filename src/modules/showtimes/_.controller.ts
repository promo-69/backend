import { ControllerBase } from '@bases/controller.base.js';
import ShowtimesService from './_.service.js';

class ShowtimesController extends ControllerBase {
    async findAll() {
        const session = this.getSession<any>();
        const data = await ShowtimesService.findAllShowtimes({
            ...this.getQueryFilters(),
            cinemaId: session?.cinemaId,
        });
        return data;
    }

    async findById() {
        const { id } = this.getParams();
        const data = await ShowtimesService.findShowtimeById(Number(id));
        return this.success(data, 'Función obtenida');
    }

    async create() {
        const session = this.getSession<any>();
        const body = this.getBody();
        const data = await ShowtimesService.createShowtime(body, session?.cinemaId);
        return this.created(data, 'Función programada exitosamente.');
    }

    async update() {
        const { id } = this.getParams();
        const body = this.getBody();
        await ShowtimesService.updateShowtime(Number(id), body);
        return this.success(null, 'Función actualizada correctamente.');
    }

    async remove() {
        const { id } = this.getParams();
        await ShowtimesService.deleteShowtime(Number(id));
        return this.success(null, 'Función y reserva de sala canceladas exitosamente.');
    }
}

export default new ShowtimesController();
