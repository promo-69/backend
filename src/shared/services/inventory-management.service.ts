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
        const result = await this._inventories.getAllByCinema(cinemaId, {
            ...filters,
            relations: [
                {
                    association: '_Products',
                    required: true,
                    nested: [{ association: '_ProductCategories', attributes: ['id', 'description'] }],
                },
            ],
        });

        const rows = Array.isArray(result) ? result : result.rows;

        const populatedRows = await Promise.all(
            rows.map(async (row: any) => {
                const plainRow = row.toJSON ? row.toJSON() : { ...row };
                const lastMovements = await this._inventoryMovements.getAll(
                    { count: false, limit: 1, order: [['id', 'DESC']] },
                    { inventory: plainRow.id }
                );

                if (lastMovements.length > 0) {
                    plainRow.stock = Number(lastMovements[0].resulting_stock);
                    plainRow.current_unit_cost_base_currency = Number(lastMovements[0].resulting_unit_cost_base_currency);
                } else {
                    plainRow.stock = 0;
                    plainRow.current_unit_cost_base_currency = 0;
                }

                return plainRow;
            })
        );

        return Array.isArray(result) ? populatedRows : { count: result.count, rows: populatedRows };
    }

    async registerMovements(
        inventoryId: number,
        movements: Array<{ operationType: number; quantity: number; remarks?: string; unit_cost?: number }>,
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

            for (const mov of movements) {
                if (!mov.quantity || mov.quantity <= 0)
                    throw new ValidationError('La cantidad debe ser un número positivo');
                const opType = await this._operationTypes.getById(mov.operationType, { transaction });
                if (!opType) throw new ValidationError(`El tipo de operación con ID ${mov.operationType} no existe`);

                const lastMovements = await this._inventoryMovements.getAll(
                    {
                        count: false,
                        limit: 1,
                        order: [['id', 'DESC']],
                        operation: { transaction, lock: transaction.LOCK.UPDATE },
                    },
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
                    if (newStock < 0) throw new ValidationError('El stock resultante no puede ser negativo');
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
                        resulting_unit_cost_base_currency: newUnitCost,
                    },
                    { transaction },
                );
            }
        });
    }
}

export default new InventoryManagementService();
