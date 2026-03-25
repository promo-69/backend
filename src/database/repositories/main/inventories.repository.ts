import { SequelizeRepositoryBase } from '@repositories/bases/sequelize.repository.js';
import InventoriesModel from '@database/models/main/inventories.model.js';

export interface InventoriesAttributes {
    id?: number;
    cinema: number;
    product: number;
    stock: number;
    status: number;
}

class InventoriesRepository extends SequelizeRepositoryBase<InventoriesAttributes, number> {
    constructor() {
        super(InventoriesModel);
    }
}

export default new InventoriesRepository();
