import { SequelizeRepositoryBase } from '@repositories/bases/sequelize.repository.js';
import CombosModel from '@database/models/main/combos.model.js';

export interface CombosAttributes {
    id?: number;
    name: string;
    sku: string;
    description: string;
    currency: number;
    price: number;
    earned_loyalty_points?: number;
    status: number;
}

class CombosRepository extends SequelizeRepositoryBase<CombosAttributes, number> {
    constructor() {
        super(CombosModel);
    }
}

export default new CombosRepository();
