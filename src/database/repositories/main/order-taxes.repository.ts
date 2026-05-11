import { SequelizeRepositoryBase } from '@repositories/bases/sequelize.repository.js';
import OrderTaxesModel from '@database/models/main/order-taxes.model.js';

export interface OrderTaxesAttributes {
    id?: number;
    order: number;
    tax: number;
    applied_rate: number;
    tax_amount_base_currency: number;
    deleted_at?: Date;
}

class OrderTaxesRepository extends SequelizeRepositoryBase<OrderTaxesAttributes, number> {
    constructor() {
        super(OrderTaxesModel);
    }
}

export default new OrderTaxesRepository();
