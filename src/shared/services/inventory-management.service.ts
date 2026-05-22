import { Database } from '@database/index.js';
import { NotFoundError, ValidationError } from '@errors';
import { Transaction } from 'sequelize';

export class InventoryManagementService {
    private get _inventories() {
        return Database.repository('main', 'inventories') as any;
    }
    private get _inventoryMovements() {
        return Database.repository('main', 'inventory-movements') as any;
    }
    private get _operationTypes() {
        return Database.repository('main', 'operation-types') as any;
    }

    async getStockByCinema(cinemaId: number, filters?: any) {
        return this._inventories.getAllByCinema(cinemaId, {
            ...filters,
            include: [
                {
                    association: '_Product',
                    include: [{ association: '_ProductCategory', attributes: ['id', 'description'] }],
                },
            ],
        });
    }

    async registerMovements(
        inventoryId: number,
        movements: Array<{ operationType: number; quantity: number; remarks?: string }>,
        userId: number,
    ) {
        if (!Array.isArray(movements) || movements.length === 0)
            throw new ValidationError('Debe enviar al menos un movimiento');

        await this._inventories.transaction(async (transaction: Transaction) => {
            const inventory = await this._inventories.getById(inventoryId, {
                transaction,
                lock: transaction.LOCK.UPDATE,
            });
            if (!inventory) throw new NotFoundError('Inventario no encontrado');

            let newStock = Number(inventory.stock) || 0;
            for (const mov of movements) {
                if (!mov.quantity || mov.quantity <= 0)
                    throw new ValidationError('La cantidad debe ser un número positivo');
                const opType = await this._operationTypes.getById(mov.operationType, { transaction });
                if (!opType) throw new ValidationError(`El tipo de operación con ID ${mov.operationType} no existe`);

                const delta = opType.is_increment ? mov.quantity : -mov.quantity;
                newStock += delta;
                if (newStock < 0) throw new ValidationError('El stock resultante no puede ser negativo');

                await this._inventoryMovements.create(
                    {
                        inventory: inventoryId,
                        operation_type: opType.id,
                        quantity: mov.quantity,
                        user: userId,
                        remarks: mov.remarks ?? null,
                        resulting_stock: newStock,
                        resulting_unit_cost_base_currency: 0,
                    },
                    { transaction },
                );
            }

            await this._inventories.update(inventoryId, { stock: newStock }, { transaction });
        });
    }
}

export default new InventoryManagementService();
