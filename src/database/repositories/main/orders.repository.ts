import { SequelizeRepositoryBase } from '@repositories/bases/sequelize.repository.js';
import OrdersModel from '@database/models/main/orders.model.js';

export interface OrdersAttributes {
	id?: number;
	customer: number;
	employee?: number;
	cinema: number;
	system_base_currency: number;
	subtotal_base_currency: number;
	tax_amount_base_currency: number;
	total_amount_base_currency: number;
	generated_points: number;
	order_status?: number;
	created_at?: Date;
	deleted_at?: Date;
}

class OrdersRepository extends SequelizeRepositoryBase<OrdersAttributes, number> {
	constructor() {
		super(OrdersModel);
	}

	private _getRelations() {
		return [
			{
				association: '_OrderLines',
				required: false,
				nested: [
					{ association: '_Products', required: false },
					{ association: '_Combos', required: false },
				],
			},
			{
				association: '_Tickets',
				separate: true,
				required: false,
				nested: [{ association: '_RoomBookings', required: false }],
			},
			{ association: '_OrderPayments', separate: true, required: false },
			{ association: '_Cinemas', required: false },
			{ association: '_Customers', required: false },
		];
	}

	async getById(id: number) {
		return super.getById(id, { relations: this._getRelations() });
	}
}

export default new OrdersRepository();
