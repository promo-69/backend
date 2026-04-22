import { ControllerBase } from '@bases/controller.base.js';
import RoomsService from './_.service.js';

class RoomsController extends ControllerBase {
    constructor() {
        super();
    }

    // GET /api/v1/cinemas/:cinemaId/rooms
    async findAll() {
        const { cinemaId } = this.getParams();
        const data = await RoomsService.findAll(Number(cinemaId), this.getQueryFilters());
        return data;
    }

    // GET /api/v1/rooms/:id
    async findById() {
        const { id } = this.getParams();
        const data = await RoomsService.findById(Number(id));
        return this.success(data, 'Sala obtenida exitosamente');
    }

    // POST /api/v1/cinemas/:cinemaId/rooms
    async create() {
        const { cinemaId } = this.getParams();
        const body = { ...this.getBody(), cinemaId: Number(cinemaId) };
        const session = this.getSession<any>();
        const data = await RoomsService.createRoom(body, session?.userId);
        return this.created(data, 'Sala registrada exitosamente. Pendiente por configurar asientos.');
    }

    // PUT /api/v1/rooms/:id
    async update() {
        const { id } = this.getParams();
        const body = this.getBody();
        await RoomsService.updateRoom(Number(id), body);
        return this.success(null, 'Datos técnicos de la sala actualizados exitosamente.');
    }

    // DELETE /api/v1/rooms/:id
    async remove() {
        const { id } = this.getParams();
        await RoomsService.deleteRoom(Number(id));
        return this.success(null, 'Sala clausurada exitosamente.');
    }

    // GET /api/v1/rooms/:id/seats
    async getSeatMap() {
        const { id } = this.getParams();
        const data = await RoomsService.getSeatMap(Number(id), this.getQueryFilters());
        return this.success(data, 'Mapa de asientos obtenido exitosamente');
    }
}

export default new RoomsController();
