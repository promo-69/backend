import { ControllerBase } from '@bases/controller.base.js';
import RoomsService from './_.service.js';
import { SeatUseCases } from '@services/seats-use-cases.service.js';

class RoomsController extends ControllerBase {
    constructor() {
        super();
    }

    // GET /rooms — stock de la sede implícita (cinemaId del JWT)
    async findAll() {
        const session = this.getSession<any>();
        const data = await RoomsService.findAll(session?.cinemaId, this.getQueryFilters());
        return data;
    }

    // GET /rooms/:id
    async findById() {
        const { id } = this.getParams();
        const data = await RoomsService.findById(Number(id));
        return this.success(data, 'Sala obtenida exitosamente');
    }

    // GET /rooms/:id/projection-types
    async findProjectionTypes() {
        const { id } = this.getParams();
        return RoomsService.findRoomProjectionTypes(Number(id));
    }

    // POST /rooms/:id/projection-types
    async createProjectionType() {
        const { id } = this.getParams();
        const { projectionType } = this.getBody();
        const data = await RoomsService.createRoomProjectionType(Number(id), Number(projectionType));
        return this.created(data, 'Tipo de proyección asignado');
    }

    // DELETE /rooms/:id/projection-types/:projectionTypeId
    async deleteProjectionType() {
        const { id, projectionTypeId } = this.getParams();
        await RoomsService.deleteRoomProjectionType(Number(id), Number(projectionTypeId));
        return this.noContent();
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

    // POST /rooms/:id/seats — delega al caso de uso compartido de asientos
    async createSeat() {
        const { id } = this.getParams();
        const body = this.getBody();
        await SeatUseCases.create(Number(id), body);
        return this.created(null, 'Asiento(s) agregado(s) exitosamente');
    }
}

export default new RoomsController();
