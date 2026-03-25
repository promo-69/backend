import { SequelizeRepositoryBase } from '@repositories/bases/sequelize.repository.js';
import ComboProductsModel from '@database/models/main/combo-products.model.js';

export interface ComboProductsAttributes {
    id?: number;
    combo: number;
    product: number;
    quantity: number;
    status: number;
}

class ComboProductsRepository extends SequelizeRepositoryBase<ComboProductsAttributes, number> {
    constructor() {
        super(ComboProductsModel);
    }
}

export default new ComboProductsRepository();
