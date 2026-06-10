import { SequelizeRepositoryBase } from '@repositories/bases/sequelize.repository.js';
import InventoriesModel from '@database/models/main/inventories.model.js';
export interface InventoriesAttributes {
	id?: number;
	cinema: number;
	product: number;
	minimum_stock?: number;
	stock: number;
	current_unit_cost_base_currency?: number;
	deleted_at?: Date;
}

class InventoriesRepository extends SequelizeRepositoryBase<any, number> {
	constructor() {
		super(InventoriesModel);
	}

	private get _relations() {
		return [{ association: '_Products', attributes: ['name', 'sku'], required: true }];
	}

	async getAllByCinema(cinemaId: number, filters?: any) {
		const relations = filters?.relations || this._relations;
		return this.getAll({ ...filters, count: true, relations }, { cinema: cinemaId });
	}
}

export default new InventoriesRepository();
