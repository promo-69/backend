import { SequelizeRepositoryBase } from '@repositories/bases/sequelize.repository.js';
import SeatConditionsModel from '@database/models/main/seat-conditions.model.js';

export interface SeatConditionsAttributes {
    id?: number;
    description: string;
    status: number;
}

class SeatConditionsRepository extends SequelizeRepositoryBase<SeatConditionsAttributes, number> {
    constructor() {
        super(SeatConditionsModel);
    }
}

export default new SeatConditionsRepository();
