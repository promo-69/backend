import { SequelizeRepositoryBase } from '@repositories/bases/sequelize.repository.js';
import ShowtimesModel from '@database/models/main/showtimes.model.js';

export interface ShowtimesAttributes {
    id?: number;
    movie: number;
    room: number;
    projection_type: number;
    start_time: Date | string;
    end_time: Date | string;
    currency: number;
    price: number;
    earned_loyalty_points?: number;
    status: number;
}

class ShowtimesRepository extends SequelizeRepositoryBase<ShowtimesAttributes, number> {
    constructor() {
        super(ShowtimesModel);
    }
}

export default new ShowtimesRepository();
