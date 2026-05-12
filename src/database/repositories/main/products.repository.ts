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
	deleted_at?: Date;
}

class ProductsRepository extends SequelizeRepositoryBase<any, number> {
	constructor() {
		super(ProductsModel);
	}

	private get _relations() {
		return [
			{ association: '_ProductCategory', attributes: ['description'], required: true },
			{ association: '_Currency', attributes: ['code', 'symbol'], required: true },
		];
	}

	async getFull(id: number) {
		return this.getOne({ id }, { relations: this._relations });
	}

	async getAllFull(filters?: any) {
		return this.getAll({ ...filters, count: true, relations: this._relations });
	}
}

export default new ProductsRepository();
