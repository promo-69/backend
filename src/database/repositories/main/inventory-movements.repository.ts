import { SequelizeRepositoryBase } from '@repositories/bases/sequelize.repository.js';
import InventoryMovementsModel from '@database/models/main/inventory-movements.model.js';

class InventoryMovementsRepository extends SequelizeRepositoryBase<any, number> {
    constructor() {
        super(InventoryMovementsModel);
    }
}

export default new InventoryMovementsRepository();
