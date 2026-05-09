import { SequelizeRepositoryBase } from '@repositories/bases/sequelize.repository.js';
import ComboProductsModel from '@database/models/main/combo-products.model.js';

class ComboProductsRepository extends SequelizeRepositoryBase<any, number> {
    constructor() {
        super(ComboProductsModel);
    }

    async deleteByCombo(comboId: number, operationOptions?: any) {
        return this.delete({ combo: comboId }, operationOptions);
    }
}

export default new ComboProductsRepository();
