import { SequelizeRepositoryBase } from '@repositories/bases/sequelize.repository.js';
import ProductsModel from '@database/models/main/products.model.js';

export interface ProductsAttributes {
    id?: number;
    name: string;
    sku: string;
    product_category: number;
    currency: number;
    price: number;
    earned_loyalty_points?: number;
    status: number;
}

class ProductsRepository extends SequelizeRepositoryBase<ProductsAttributes, number> {
    constructor() {
        super(ProductsModel);
    }
}

export default new ProductsRepository();
