import { BaseService } from '@bases/service.base.js';
import { Database } from '@database/index.js';
import { NotFoundError, ValidationError } from '@errors';
import { Transaction } from 'sequelize';

export class InventoryService extends BaseService {
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

    async getInventoryDetail(inventoryId: number) {
        const inv = await this._inventories.getById(inventoryId, {
            relations: [
                {
                    association: '_Product',
                    attributes: ['id', 'name', 'sku', 'price', 'image_url'],
                    include: [{ association: '_ProductCategory', attributes: ['id', 'description'] }],
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
        if (!Array.isArray(movements) || movements.length === 0) {
            throw new ValidationError('Debe enviar al menos un movimiento');
        }

        await this._inventories.transaction(async (transaction: Transaction) => {
            const inventory = await this._inventories.getById(inventoryId, {
                transaction,
                lock: transaction.LOCK.UPDATE,
            });
            if (!inventory) throw new NotFoundError('Inventario no encontrado');

            for (const mov of movements) {
                if (!mov.quantity || mov.quantity <= 0) {
                    throw new ValidationError('La cantidad de cada movimiento debe ser un número positivo');
                }

                const opType = await this._operationTypes.getById(mov.operationType, { transaction });
                if (!opType) {
                    throw new ValidationError(
                        `El tipo de operación con ID ${mov.operationType} no existe en el sistema`,
                    );
                }

                const lastMovements = await this._inventoryMovements.getAll(
                    { count: false, limit: 1, order: [['id', 'DESC']], operation: { transaction } },
                    { inventory: inventoryId }
                );
                const currentStock = lastMovements.length > 0 ? Number(lastMovements[0].resulting_stock) : 0;
                const currentCost = lastMovements.length > 0 ? Number(lastMovements[0].resulting_unit_cost_base_currency) : 0;

                let newStock = currentStock;
                let newUnitCost = currentCost;

                if (opType.is_increment) {
                    newStock += mov.quantity;
                    newUnitCost = ((currentStock * currentCost) + (mov.quantity * (mov.unit_cost ?? 0))) / newStock;
                } else {
                    newStock -= mov.quantity;
                    if (newStock < 0) throw new ValidationError('El stock resultante no puede ser negativo. Verifica las cantidades de salida');
                }

                await this._inventoryMovements.create(
                    {
                        inventory: inventoryId,
                        operation_type: opType.id,
                        quantity: mov.quantity,
                        unit_cost: mov.unit_cost ?? 0,
                        currency: 1,
                        user: userId,
                        remarks: mov.remarks ?? null,
                        resulting_stock: newStock,
                        resulting_unit_cost_base_currency: newUnitCost
                    },
                    { transaction },
                );
            }
        });

        return null;
    }
}

export default new InventoryService();
