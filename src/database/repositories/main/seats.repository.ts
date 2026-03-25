import { SequelizeRepositoryBase } from '@repositories/bases/sequelize.repository.js';
import SeatsModel from '@database/models/main/seats.model.js';

export interface SeatsAttributes {
    id?: number;
    room: number;
    row_identifier: string;
    column_number: number;
    seat_category: number;
    seat_condition: number;
    status: number;
}

class SeatsRepository extends SequelizeRepositoryBase<SeatsAttributes, number> {
    constructor() {
        super(SeatsModel);
    }
}

export default new SeatsRepository();
