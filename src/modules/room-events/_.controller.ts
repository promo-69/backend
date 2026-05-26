import { ControllerBase } from '@bases/controller.base.js';
import RoomEventsService from './_.service.js';

class RoomEventsController extends ControllerBase {
    async findAll() {
        const session = this.getSession<any>();
        const data = await RoomEventsService.findAllEvents({
            ...this.getQueryFilters(),
            cinemaId: session?.cinemaId,
        });
        return data;
    }

    async findById() {
        const { id } = this.getParams();
        const data = await RoomEventsService.findEventById(Number(id));
        return this.success(data, 'Evento obtenido');
    }

    async create() {
        const session = this.getSession<any>();
        const body = this.getBody();
        const data = await RoomEventsService.createEvent(body, session?.cinemaId);
        return this.created(data, 'Evento programado exitosamente.');
    }

    async update() {
        const { id } = this.getParams();
        const body = this.getBody();
        await RoomEventsService.updateEvent(Number(id), body);
        return this.success(null, 'Evento actualizado correctamente.');
    }

    async remove() {
        const { id } = this.getParams();
        await RoomEventsService.deleteEvent(Number(id));
        return this.success(null, 'Evento alternativo y reserva de sala cancelados.');
    }
}

export default new RoomEventsController();
