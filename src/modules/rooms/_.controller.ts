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
        return this.created(data, 'Sala registrada exitosamente');
    }

    // PUT /api/v1/rooms/:id
    async update() {
        const { id } = this.getParams();
        const body = this.getBody();
        const session = this.getSession<any>();
        const data = await RoomsService.updateRoom(Number(id), body, session?.userId);
        return this.updated(data, 'Sala actualizada exitosamente');
    }

    // DELETE /api/v1/rooms/:id
    async remove() {
        const { id } = this.getParams();
        const session = this.getSession<any>();
        const data = await RoomsService.deleteRoom(Number(id), session?.userId);
        return this.success(data, 'Sala eliminada exitosamente');
    }

    // PUT /api/v1/rooms/:id/seat-grid
    async configureSeatGrid() {
        const { id } = this.getParams();
        const body = this.getBody();
        const session = this.getSession<any>();
        const data = await RoomsService.configureSeatGrid(Number(id), body, session?.userId);
        return this.updated(data, 'Distribución de asientos actualizada exitosamente');
    }

    // GET /api/v1/rooms/:id/seats
    async findSeats() {
        const { id } = this.getParams();
        const data = await RoomsService.findSeatsByRoom(Number(id), this.getQueryFilters());
        return data;
    }

    // PATCH /api/v1/rooms/:id/seats/disable
    async disableSeats() {
        const { id } = this.getParams();
        const { seatIds } = this.getBody();
        const session = this.getSession<any>();
        const data = await RoomsService.disableSeats(Number(id), seatIds, session?.userId);
        return this.success(data, 'Asientos inhabilitados exitosamente');
    }

    // PATCH /api/v1/rooms/:id/seats/enable
    async enableSeats() {
        const { id } = this.getParams();
        const { seatIds } = this.getBody();
        const session = this.getSession<any>();
        const data = await RoomsService.enableSeats(Number(id), seatIds, session?.userId);
        return this.success(data, 'Asientos rehabilitados exitosamente');
    }
}

export default new RoomsController();
