import { ControllerBase } from '@bases/controller.base.js';
import RoomsService from './_.service.js';

class RoomsController extends ControllerBase {
    constructor() {
        super();
    }

    // GET /rooms (o /cinemas/:cinemaId/rooms)
    async findAll() {
        const { cinemaId } = this.getParams();
        const filters = this.getQueryFilters();
        const data = cinemaId
            ? await RoomsService.findAll(Number(cinemaId), filters)
            : await RoomsService.findAll(undefined, filters);
        return data;
    }

    // GET /rooms/:id/projection-types
    async findProjectionTypes() {
        const { id } = this.getParams();
        return RoomsService.findRoomProjectionTypes(Number(id));
    }

    // POST /rooms/:id/projection-types
    async createProjectionType() {
        const { id } = this.getParams();
        const { projectionType } = this.getBody(); // ← camelCase
        const data = await RoomsService.createRoomProjectionType(Number(id), Number(projectionType));
        return this.created(data, 'Tipo de proyección asignado');
    }

    // DELETE /rooms/:id/projection-types/:projectionTypeId
    async deleteProjectionType() {
        const { id, projectionTypeId } = this.getParams();
        await RoomsService.deleteRoomProjectionType(Number(id), Number(projectionTypeId));
        return this.noContent();
    }

    // GET /rooms/:id
    async findById() {
        const { id } = this.getParams();
        const data = await RoomsService.findById(Number(id));
        return this.success(data, 'Sala obtenida exitosamente');
    }

    // POST /cinemas/:cinemaId/rooms
    async create() {
        const { cinemaId } = this.getParams();
        const body = this.getBody();
        const session = this.getSession<any>();
        const data = await RoomsService.createRoom(Number(cinemaId), body, session?.userId);
        return this.created(data, 'Sala registrada exitosamente');
    }

    // PATCH /rooms/:id
    async update() {
        const { id } = this.getParams();
        const body = this.getBody();
        await RoomsService.updateRoom(Number(id), body);
        return this.success(null, 'Sala actualizada exitosamente');
    }

    // DELETE /rooms/:id
    async remove() {
        const { id } = this.getParams();
        await RoomsService.deleteRoom(Number(id));
        return this.success(null, 'Sala clausurada exitosamente');
    }

    // GET /rooms/:id/seats
    async getSeatMap() {
        const { id } = this.getParams();
        const data = await RoomsService.getSeatMap(Number(id), this.getQueryFilters());
        return this.success(data, 'Mapa de asientos obtenido exitosamente');
    }
}

export default new RoomsController();
