import { SequelizeRepositoryBase } from '@repositories/bases/sequelize.repository.js';
import InventoryMovementsModel from '@database/models/main/inventory-movements.model.js';

export interface InventoryMovementsAttributes {
    id?: number;
    inventory: number;
    operation_type: number;
    quantity: number;
    user: number;
    created_at?: Date | string;
    remarks?: string;
    status: number;
}

class InventoryMovementsRepository extends SequelizeRepositoryBase<InventoryMovementsAttributes, number> {
    constructor() {
        super(InventoryMovementsModel);
    }
}

export default new InventoryMovementsRepository();
