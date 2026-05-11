import { SequelizeRepositoryBase } from '@repositories/bases/sequelize.repository.js';
import CurrenciesModel from '@database/models/main/currencies.model.js';

export interface CurrenciesAttributes {
    id?: number;
    code: string;
    description: string;
    symbol: string;
    is_base_currency: boolean;
    deleted_at?: Date;
}

class CurrenciesRepository extends SequelizeRepositoryBase<CurrenciesAttributes, number> {
    constructor() {
        super(CurrenciesModel);
    }
}

export default new CurrenciesRepository();
