import { SequelizeRepositoryBase } from '@repositories/bases/sequelize.repository.js';
import ProductCategoriesModel from '@database/models/main/product-categories.model.js';

export interface ProductCategoriesAttributes {
    id?: number;
    description: string;
    status: number;
}

class ProductCategoriesRepository extends SequelizeRepositoryBase<ProductCategoriesAttributes, number> {
    constructor() {
        super(ProductCategoriesModel);
    }
}

export default new ProductCategoriesRepository();
