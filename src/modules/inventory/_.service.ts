import { BaseService } from '@bases/service.base.js';
import InventoryManagementService from '@services/inventory-management.service.js';
import { Database } from '@database/index.js';
import { NotFoundError } from '@errors';

export class InventoryService extends BaseService {
    private get _inventories() {
        return Database.repository('main', 'inventories') as any;
    }
    private get _inventoryMovements() {
        return Database.repository('main', 'inventory-movements') as any;
    }

    async getStockByCinema(cinemaId: number, filters?: any) {
        return InventoryManagementService.getStockByCinema(cinemaId, filters);
    }

    async getInventoryDetail(inventoryId: number) {
        const inv = await this._inventories.getById(inventoryId, {
            relations: [
                {
                    association: '_Products',
                    attributes: ['id', 'name', 'sku', 'price', 'image_url', 'currency', 'product_category'],
                    nested: [{ association: '_ProductCategories', attributes: ['id', 'description'] }],
                },
            ],
        });
        if (!inv) throw new NotFoundError('Registro de inventario no encontrado');

        const movements = await this._inventoryMovements.getAll(
            { count: false, order: [['created_at', 'DESC']] },
            { inventory: inventoryId },
        );

        return {
            ...inv,
            movements: Array.isArray(movements) ? movements : movements.rows,
        };
    }

    /**
     * Registra un lote de movimientos (entrada/salida/merma)
     */
    async registerMovements(
        inventoryId: number,
        movements: Array<{ operationType: number; quantity: number; remarks?: string; unit_cost?: number }>,
        userId: number,
    ) {
        await InventoryManagementService.registerMovements(inventoryId, movements, userId);
        return null;
    }
}

export default new InventoryService();
