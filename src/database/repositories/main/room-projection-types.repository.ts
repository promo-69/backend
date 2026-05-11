import { SequelizeRepositoryBase } from '@repositories/bases/sequelize.repository.js';
import RoomProjectionTypesModel from '@database/models/main/room-projection-types.model.js';

export interface RoomProjectionTypesAttributes {
	id?: number;
	room: number;
	projection_type: number;
	deleted_at?: Date;
}

class RoomProjectionTypesRepository extends SequelizeRepositoryBase<RoomProjectionTypesAttributes, number> {
	constructor() {
		super(RoomProjectionTypesModel);
	}

	async deleteByRoom(roomId: number, operationOptions?: any): Promise<number> {
		return this.delete({ room: roomId }, operationOptions) as Promise<number>;
	}

	async getByRoom(roomId: number): Promise<RoomProjectionTypesAttributes[]> {
		return this.getAll({ count: false }, { room: roomId, status: 1 }) as Promise<RoomProjectionTypesAttributes[]>;
	}
}

export default new RoomProjectionTypesRepository();
