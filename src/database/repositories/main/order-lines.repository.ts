import { SequelizeRepositoryBase } from '@repositories/bases/sequelize.repository.js';
import OrderLinesModel from '@database/models/main/order-lines.model.js';

export interface OrderLinesAttributes {
    id?: number;
    order: number;
    line_type: number;
    product?: number;
    combo?: number;
    quantity: number;
    original_unit_price: number;
    price_modifier?: number;
    unit_price: number;
    quoted_exchange_rate: number;
    deleted_at?: Date;
}

class OrderLinesRepository extends SequelizeRepositoryBase<OrderLinesAttributes, number> {
    constructor() {
        super(OrderLinesModel);
    }
}

export default new OrderLinesRepository();
