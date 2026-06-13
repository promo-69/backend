import { ControllerBase } from '@bases/controller.base.js';
import RoomManagementService from '@services/room-management.service.js';

class CinemaRoomsController extends ControllerBase {
    async findAll() {
        const { cinemaId } = this.getParams();
        const data = await RoomManagementService.findByCinema(Number(cinemaId), this.getQueryFilters());
        return data;
    }

    async create() {
        const { cinemaId } = this.getParams();
        const body = this.getBody();
        const session = this.getSession<any>();
        const data = await RoomManagementService.createRoom(Number(cinemaId), body, session?.userId);
        return this.created(data, 'Sala registrada exitosamente');
    }
}

export default new CinemaRoomsController();
