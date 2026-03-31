import { SequelizeRepositoryBase } from '@repositories/bases/sequelize.repository.js';
import OrdersModel from '@database/models/main/orders.models.js';

export interface OrdersAttributes {
    id?: number;
    customer: number;
    employee?: number;
    cinema: number;
    order_status: number;
    base_currency: number;
    total_amount_base_currency: number;
    generated_points: number;
    created_at?: Date | string;
    status: number;
}

class OrdersRepository extends SequelizeRepositoryBase<OrdersAttributes, number> {
    constructor() {
        super(OrdersModel);
    }
}

export default new OrdersRepository();
