import { SequelizeRepositoryBase } from '@repositories/bases/sequelize.repository.js';
import InventoryMovementsModel from '@database/models/main/inventory-movements.model.js';
export interface InventoryMovementsAttributes {
    id?: number;
    inventory: number;
    operation_type: number;
    quantity: number;
    unit_cost?: number;
    currency?: number;
    user: number;
    created_at?: Date;
    remarks?: string;
    deleted_at?: Date;
}


class InventoryMovementsRepository extends SequelizeRepositoryBase<any, number> {
    constructor() {
        super(InventoryMovementsModel);
    }
}

export default new InventoryMovementsRepository();
