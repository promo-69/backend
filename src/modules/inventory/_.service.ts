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
    // El modelo tiene appRawName: 'operation-types', por eso usamos ese nombre
    private get _operationTypes() {
        return Database.repository('main', 'operation-types') as any;
    }

    /** Stock de todos los productos en una sucursal */
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

    /** Detalle de un registro de inventario + últimos movimientos */
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
            { count: false, order: [['created_at', 'DESC']], limit: 20 },
            { inventory: inventoryId },
        );
        return {
            ...inv,
            movements: Array.isArray(movements) ? movements : movements.rows,
        };
    }

    /**
     * Registra un lote de movimientos (entrada/salida/merma).
     * El tipo de operación se identifica por su descripción (única según migración).
     */
    async registerMovements(
        inventoryId: number,
        movements: Array<{ operationType: string; quantity: number; remarks?: string }>,
        userId: number,
    ) {
        if (!Array.isArray(movements) || movements.length === 0) {
            throw new ValidationError('Debe enviar al menos un movimiento', ['movements']);
        }

        await this._inventories.transaction(async (transaction: Transaction) => {
            const inventory = await this._inventories.getById(inventoryId, {
                transaction,
                lock: transaction.LOCK.UPDATE,
            });
            if (!inventory) throw new NotFoundError('Inventario no encontrado');

            let newStock = inventory.stock;

            for (const mov of movements) {
                if (!mov.quantity || mov.quantity <= 0)
                    throw new ValidationError('La cantidad debe ser positiva', ['quantity']);

                // Buscar por descripción (única) en lugar de código
                const opType = await this._operationTypes.getOne({ description: mov.operationType }, { transaction });
                if (!opType)
                    throw new ValidationError(`Tipo de operación desconocido: ${mov.operationType}`, ['operationType']);

                const delta = opType.is_increment ? mov.quantity : -mov.quantity;
                newStock += delta;

                if (newStock < 0) throw new ValidationError('Stock insuficiente para la operación', ['quantity']);

                await this._inventoryMovements.create(
                    {
                        inventory: inventoryId,
                        operation_type: opType.id,
                        quantity: mov.quantity,
                        user: userId,
                        remarks: mov.remarks ?? null,
                    },
                    { transaction },
                );
            }

            await this._inventories.update(inventoryId, { stock: newStock }, { transaction });
        });

        return null;
    }
}

export default new InventoryService();
