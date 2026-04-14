import { SequelizeRepositoryBase } from '@repositories/bases/sequelize.repository.js';
import RoomProjectionTypesModel from '@database/models/main/room-projection-types.model.js';

export interface RoomProjectionTypesAttributes {
    id?: number;
    room: number;
    projection_type: number;
    status: number;
}

class RoomProjectionTypesRepository extends SequelizeRepositoryBase<RoomProjectionTypesAttributes, number> {
    constructor() {
        super(RoomProjectionTypesModel);
    }
}

export default new RoomProjectionTypesRepository();
