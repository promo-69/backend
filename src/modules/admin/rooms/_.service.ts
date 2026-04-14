import { BaseService } from '@bases/service.base.js';
import { Database } from '@database/index.js';

export class RoomsService extends BaseService {
    constructor() {
        super();
    }

    private get _rooms() {
        return Database.repository('main', 'rooms') as any;
    }

    async findAllRooms(filters?: any) {
        return this._rooms.getAll(filters || {});
    }

    async findRoomById(id: number) {
        return this._rooms.getById(id);
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
