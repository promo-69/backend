import { SequelizeRepositoryBase } from '@repositories/bases/sequelize.repository.js';
import OrderPaymentsModel from '@database/models/main/order-payments.model.js';

export interface OrderPaymentsAttributes {
    id?: number;
    order: number;
    payment_method: number;
    amount: number;
    applied_exchange_rate: number;
    reference_number?: string;
    is_approved: boolean;
    status: number;
}

class OrderPaymentsRepository extends SequelizeRepositoryBase<OrderPaymentsAttributes, number> {
    constructor() {
        super(OrderPaymentsModel);
    }
}

export default new OrderPaymentsRepository();
