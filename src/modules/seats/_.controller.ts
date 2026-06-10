import { ControllerBase } from '@bases/controller.base.js';
import SeatsService from './_.service.js';

class SeatsController extends ControllerBase {
    constructor() {
        super();
    }

    // GET /api/v1/seats/:id
    async findById() {
        const { id } = this.getParams();
        const data = await SeatsService.findById(Number(id));
        return this.success(data, 'Asiento obtenido exitosamente');
    }

    // PATCH /api/v1/seats/:id
    async update() {
        const { id } = this.getParams();
        const body = this.getBody();
        await SeatsService.updateSeat(Number(id), body);
        return this.success(null, 'Asiento actualizado correctamente');
    }

    // DELETE /api/v1/seats/:id — eliminar un asiento por su ID
    async remove() {
        const { id } = this.getParams();
        await SeatsService.deleteSeat(Number(id));
        return this.success(null, 'Asiento eliminado de la sala');
    }

    // DELETE /api/v1/seats/room/:roomId — eliminar TODOS los asientos de una sala
    async removeByRoom() {
        const { roomId } = this.getParams();
        await SeatsService.deleteSeatsByRoom(Number(roomId));
        return this.success(null, 'Asientos de la sala eliminados exitosamente');
    }
}

export default new SeatsController();
