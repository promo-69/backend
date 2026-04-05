import { SequelizeRepositoryBase } from '@repositories/bases/sequelize.repository.js';
import RoomsModel from '@database/models/main/rooms.model.js';

export interface RoomAttributes {
    id?: number;
    cinema: number;
    name: string;
    grid_rows: number;
    grid_columns: number;
    total_capacity: number;
    status?: number;
}

class RoomsRepository extends SequelizeRepositoryBase<RoomAttributes, number> {
    constructor() {
        super(RoomsModel);
    }
}

export default new RoomsRepository();
