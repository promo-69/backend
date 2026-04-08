import { ControllerBase } from '@bases/controller.base.js';
import { NotFoundError, ValidationError } from '@errors';
import RoomsService from './_.service.js';

class RoomsController extends ControllerBase {
    async findAll() {
        const data = await RoomsService.findAllRooms(this.getQueryFilters());
        return data;
    }

    async findById() {
        const { id } = this.getParams();
        const data = await RoomsService.findRoomById(Number(id));

        if (!data) {
            throw new NotFoundError('Room', id);
        }

        return data;
    }

    async create() {
        const roomData = this.getBody();

        // Validate required fields
        this.requireBodyField('cinema');
        this.requireBodyField('name');
        this.requireBodyField('grid_rows');
        this.requireBodyField('grid_columns');
        this.requireBodyField('total_capacity');

        // Additional validation
        if (!roomData.name || typeof roomData.name !== 'string' || roomData.name.trim().length === 0) {
            throw new ValidationError('Name is required and must be a non-empty string');
        }
        if (!roomData.grid_rows || typeof roomData.grid_rows !== 'number' || roomData.grid_rows <= 0) {
            throw new ValidationError('Grid rows must be a positive number');
        }
        if (!roomData.grid_columns || typeof roomData.grid_columns !== 'number' || roomData.grid_columns <= 0) {
            throw new ValidationError('Grid columns must be a positive number');
        }
        if (!roomData.total_capacity || typeof roomData.total_capacity !== 'number' || roomData.total_capacity <= 0) {
            throw new ValidationError('Total capacity must be a positive number');
        }

        const data = await RoomsService.createRoom(roomData);
        this.created(data, 'Room created successfully');
    }

    async update() {
        const { id } = this.getParams();
        const roomData = this.getBody();

        // Check if room exists
        const existingRoom = await RoomsService.findRoomById(Number(id));
        if (!existingRoom) {
            throw new NotFoundError('Room', id);
        }

        // Validate fields if provided
        if (roomData.name !== undefined && (!roomData.name || typeof roomData.name !== 'string' || roomData.name.trim().length === 0)) {
            throw new ValidationError('Name must be a non-empty string');
        }
        if (roomData.grid_rows !== undefined && (typeof roomData.grid_rows !== 'number' || roomData.grid_rows <= 0)) {
            throw new ValidationError('Grid rows must be a positive number');
        }
        if (roomData.grid_columns !== undefined && (typeof roomData.grid_columns !== 'number' || roomData.grid_columns <= 0)) {
            throw new ValidationError('Grid columns must be a positive number');
        }
        if (roomData.total_capacity !== undefined && (typeof roomData.total_capacity !== 'number' || roomData.total_capacity <= 0)) {
            throw new ValidationError('Total capacity must be a positive number');
        }

        const affectedRows = await RoomsService.updateRoom(Number(id), roomData);
        this.updated({ affectedRows }, 'Room updated successfully');
    }

    async delete() {
        const { id } = this.getParams();

        // Check if room exists
        const existingRoom = await RoomsService.findRoomById(Number(id));
        if (!existingRoom) {
            throw new NotFoundError('Room', id);
        }

        await RoomsService.deleteRoom(Number(id));
        this.noContent();
    }
}

export default new RoomsController();
