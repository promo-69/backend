import { SequelizeRepositoryBase } from '@repositories/bases/sequelize.repository.js';
import InventoriesModel from '@database/models/main/inventories.model.js';

class InventoriesRepository extends SequelizeRepositoryBase<any, number> {
    constructor() {
        super(InventoriesModel);
    }

    private get _relations() {
        return [
            { association: '_Product', attributes: ['name', 'sku'], required: true },
            { association: '_Status', attributes: ['description'], required: true },
        ];
    }

    async getAllByCinema(cinemaId: number, filters?: any) {
        return this.getAll({ ...filters, count: true, relations: this._relations }, { cinema: cinemaId, status: 1 });
    }
}

export default new InventoriesRepository();
