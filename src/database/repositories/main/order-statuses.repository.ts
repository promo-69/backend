import { SequelizeRepositoryBase } from '@repositories/bases/sequelize.repository.js';
import OrderStatusesModel from '@database/models/main/order-statuses.model.js';

export interface OrderStatusesAttributes {
    id?: number;
    description: string;
    status: number;
}

class OrderStatusesRepository extends SequelizeRepositoryBase<OrderStatusesAttributes, number> {
    constructor() {
        super(OrderStatusesModel);
    }
}

export default new OrderStatusesRepository();
