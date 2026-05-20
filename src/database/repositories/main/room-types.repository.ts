import { SequelizeRepositoryBase } from '@repositories/bases/sequelize.repository.js';
import RoomTypesModel from '@database/models/main/room-types.model.js';

export interface RoomTypesAttributes {
	id?: number;
	description: string;
	deleted_at?: Date;
}

class RoomTypesRepository extends SequelizeRepositoryBase<RoomTypesAttributes, number> {
	constructor() {
		super(RoomTypesModel);
	}
}

export default new RoomTypesRepository();
