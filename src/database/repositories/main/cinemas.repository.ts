import { SequelizeRepositoryBase } from '@repositories/bases/sequelize.repository.js';
import CinemasModel from '@database/models/main/cinemas.model.js';

export interface CinemaAttributes {
    id?: number;
    name: string;
    address?: string | null;
    phone?: string | null;
    opening_time: string;
    closing_time: string;
    status?: number;
}

class CinemasRepository extends SequelizeRepositoryBase<CinemaAttributes, number> {
    constructor() {
        super(CinemasModel);
    }
}

export default new CinemasRepository();
