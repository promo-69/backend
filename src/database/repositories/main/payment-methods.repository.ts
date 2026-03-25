import { SequelizeRepositoryBase } from '@repositories/bases/sequelize.repository.js';
import PaymentMethodsModel from '@database/models/main/payment-methods.model.js';

export interface PaymentMethodsAttributes {
    id?: number;
    description: string;
    requires_reference: boolean;
    status: number;
}

class PaymentMethodsRepository extends SequelizeRepositoryBase<PaymentMethodsAttributes, number> {
    constructor() {
        super(PaymentMethodsModel);
    }
}

export default new PaymentMethodsRepository();
