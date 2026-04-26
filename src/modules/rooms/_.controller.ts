import { ControllerBase } from '@bases/controller.base.js';
import RoomsService from './_.service.js';
import { NotFoundError } from '@errors/not-found.error.js';
import { ValidationError } from '@errors/validation.error.js';

class RoomsController extends ControllerBase {
    constructor() {
        super();
    }

    // GET /api/v1/cinemas/:cinemaId/rooms
    async findAll() {
        const { cinemaId } = this.getParams();

        if (cinemaId !== undefined) {
            const data = await RoomsService.findAll(Number(cinemaId), this.getQueryFilters());
            return data;
        }

        const data = await RoomsService.findAll(undefined, this.getQueryFilters());
        return data;
    }

    async findProjectionTypes() {
        const { id } = this.getParams();
        const roomId = Number(id);

        const existingRoom = await RoomsService.findById(roomId);
        if (!existingRoom) {
            throw new NotFoundError('Room', id);
        }

        const data = await RoomsService.findRoomProjectionTypes(roomId, this.getQueryFilters());
        return data;
    }

    async createProjectionType() {
        const { id } = this.getParams();
        const roomId = Number(id);

        const existingRoom = await RoomsService.findById(roomId);
        if (!existingRoom) {
            throw new NotFoundError('Room', id);
        }

        this.requireBodyField('projection_type');
        const projectionType = this.getBody().projection_type;

        if (typeof projectionType !== 'number' || projectionType <= 0) {
            throw new ValidationError('projection_type must be a positive number');
        }

        const data = await RoomsService.createRoomProjectionType(roomId, { projection_type: projectionType });
        this.created(data, 'Room projection type created successfully');
    }

    async deleteProjectionType() {
        const { id, projectionTypeId } = this.getParams();
        const roomPk = Number(id);
        const projectionPk = Number(projectionTypeId);

        const existingRoom = await RoomsService.findById(roomPk);
        if (!existingRoom) {
            throw new NotFoundError('Room', id);
        }

        const existingProjection = await RoomsService.findRoomProjectionTypeById(projectionPk, roomPk);
        if (!existingProjection) {
            throw new NotFoundError('RoomProjectionType', projectionTypeId);
        }

        await RoomsService.deleteRoomProjectionType(projectionPk, roomPk);
        this.noContent();
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

        this.requireBodyField('name');
        this.requireBodyField('projectionTypes');
        this.requireBodyField('gridRows');
        this.requireBodyField('gridColumns');
        this.requireBodyField('totalCapacity');

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
