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
	deleted_at?: Date;
}

class CombosRepository extends SequelizeRepositoryBase<any, number> {
	constructor() {
		super(CombosModel);
	}

	private get _relations() {
		return [
			{ association: '_Currency', attributes: ['code', 'symbol'], required: true },
			{ association: '_Status', attributes: ['description'], required: true },
			{
				association: '_ComboProducts',
				attributes: ['id', 'product', 'quantity'],
				required: false,
				nested: [{ association: '_Product', attributes: ['name', 'sku'], required: true }],
			},
		];
	}

	async getFull(id: number) {
		return this.getOne({ id }, { relations: this._relations });
	}

	async getAllFull(filters?: any) {
		return this.getAll({ ...filters, count: true, relations: this._relations }, { status: 1 });
	}
}

export default new CombosRepository();
