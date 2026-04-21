import { BaseService } from '@bases/service.base.js';
import { Database } from '@database/index.js';

export class RoomsService extends BaseService {
    constructor() {
        super();
    }

    private get _rooms() {
        return Database.repository('main', 'rooms') as any;
    }

    private get _roomProjectionTypes() {
        return Database.repository('main', 'room-projection-types') as any;
    }

    async findAllRooms(filters?: any) {
        return this._rooms.getAll(filters || {});
    }

    async findRoomById(id: number) {
        return this._rooms.getById(id);
    }

    async findRoomProjectionTypes(roomId: number, filters?: any) {
        return this._roomProjectionTypes.getAll(filters || {}, { room: roomId, status: 1 });
    }

    async findRoomProjectionTypeById(id: number, roomId: number) {
        return this._roomProjectionTypes.getOne({ id, room: roomId });
    }

    async createRoomProjectionType(roomId: number, projectionTypeData: any) {
        return this._roomProjectionTypes.create({ ...projectionTypeData, room: roomId, status: 1 });
    }

    async deleteRoomProjectionType(id: number, roomId: number) {
        return this._roomProjectionTypes.update({ id, room: roomId }, { status: 0 });
    }

    async createRoom(roomData: any) {
        return this._rooms.create(roomData);
    }

    async updateRoom(id: number, roomData: any) {
        return this._rooms.update(id, roomData);
    }

    async deleteRoom(id: number) {
        return this._rooms.update(id, { status: 0 });
    }
}

export default new RoomsService();
