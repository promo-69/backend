import { SequelizeRepositoryBase } from '@repositories/bases/sequelize.repository.js';
import LoyaltyLedgersModel from '@database/models/main/loyalty-ledgers.model.js';

export interface LoyaltyLedgersAttributes {
    id?: number;
    customer: number;
    order?: number;
    operation_type: number;
    points: number;
    created_at?: Date;
    deleted_at?: Date;
}

class LoyaltyLedgersRepository extends SequelizeRepositoryBase<LoyaltyLedgersAttributes, number> {
    constructor() {
        super(LoyaltyLedgersModel);
    }
}

export default new LoyaltyLedgersRepository();
