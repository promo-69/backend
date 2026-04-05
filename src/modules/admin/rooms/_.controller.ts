import { ControllerBase } from '@bases/controller.base.js';
import RoomsService from './_.service.js';

class RoomsController extends ControllerBase {
    async findAll() {
        const data = await RoomsService.findAllRooms(this.getQueryFilters());
        return data;
    }

    async findById() {
        const { id } = this.getParams();
        const data = await RoomsService.findRoomById(Number(id));
        return data;
    }

    async create() {
        const roomData = this.getBody();
        const data = await RoomsService.createRoom(roomData);
        this.created(data, 'Room created successfully');
    }

    async update() {
        const { id } = this.getParams();
        const roomData = this.getBody();
        const affectedRows = await RoomsService.updateRoom(Number(id), roomData);
        this.updated({ affectedRows }, 'Room updated successfully');
    }

    async delete() {
        const { id } = this.getParams();
        const affectedRows = await RoomsService.deleteRoom(Number(id));
        this.success({ affectedRows }, 'Room deleted successfully');
    }
}

export default new RoomsController();
