import { SequelizeRepositoryBase } from '@repositories/bases/sequelize.repository.js';
import CinemasModel from '@database/models/main/cinemas.model.js';

export interface CinemasAttributes {
    id?: number;
    name: string;
    address?: string;
    phone?: string;
    opening_time: string;
    closing_time: string;
    status: number;
}

class CinemasRepository extends SequelizeRepositoryBase<CinemasAttributes, number> {
    constructor() {
        super(CinemasModel);
    }
}

export default new CinemasRepository();
