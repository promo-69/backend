import { SequelizeRepositoryBase } from '@repositories/bases/sequelize.repository.js';
import TicketsModel from '@database/models/main/tickets.model.js';

export interface TicketsAttributes {
    id?: number;
    order: number;
    showtime: number;
    seat: number;
    original_price: number;
    price_modifier?: number;
    price: number;
    quoted_exchange_rate: number;
    qr_code: string;
    validation_time?: Date;
    deleted_at?: Date;
}

class TicketsRepository extends SequelizeRepositoryBase<TicketsAttributes, number> {
    constructor() {
        super(TicketsModel);
    }
}

export default new TicketsRepository();
