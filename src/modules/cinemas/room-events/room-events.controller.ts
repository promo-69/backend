import { ControllerBase } from '@bases/controller.base.js';
import RoomEventManagementService from '@services/room-event-management.service.js';

class CinemaRoomEventsController extends ControllerBase {
    async findAll() {
        const { cinemaId } = this.getParams();
        const data = await RoomEventManagementService.findAllEvents({
            ...this.getQueryFilters(),
            cinemaId: Number(cinemaId),
        });
        return data;
    }

    async create() {
        const body = this.getBody();
        const data = await RoomEventManagementService.createEvent(body);
        return this.created(data, 'Evento programado exitosamente en la sede remota.');
    }
}

export default new CinemaRoomEventsController();
