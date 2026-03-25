import { SequelizeRepositoryBase } from '@repositories/bases/sequelize.repository.js';
import PriceModifiersModel from '@database/models/main/price-modifiers.model.js';

export interface PriceModifiersAttributes {
    id?: number;
    description: string;
    modifier_scope: number;
    audience_category?: number;
    week_day?: number;
    seat_category?: number;
    projection_type?: number;
    product_category?: number;
    product?: number;
    combo?: number;
    operation_type: number;
    is_percentage: boolean;
    value: number;
    status: number;
}

class PriceModifiersRepository extends SequelizeRepositoryBase<PriceModifiersAttributes, number> {
    constructor() {
        super(PriceModifiersModel);
    }
}

export default new PriceModifiersRepository();
