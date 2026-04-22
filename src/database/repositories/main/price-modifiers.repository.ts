import { SequelizeRepositoryBase } from '@repositories/bases/sequelize.repository.js';
import PriceModifiersModel from '@database/models/main/price-modifiers.model.js';

export interface PriceModifiersAttributes {
    id?: number;
    description: string;
    modifier_scope: number;
    audience_category?: number | null;
    week_day?: number | null;
    seat_category?: number | null;
    projection_type?: number | null;
    product_category?: number | null;
    product?: number | null;
    combo?: number | null;
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
