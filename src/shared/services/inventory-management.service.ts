import { Database } from '@database/index.js';
import { ConflictError, NotFoundError, ValidationError } from '@errors';
import { Transaction } from 'sequelize';

const PRODUCT_RELATIONS = [
    {
        association: '_Products',
        required: true,
        relations: [
			{ association: '_ProductCategories', attributes: ['id', 'description'] },
		],
    }
];

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
    private get _products() {
        return Database.repository('main', 'products') as any;
    }

    // -------------------------------------------------------------------------
    //  LECTURA — STOCK POR SUCURSAL
    // -------------------------------------------------------------------------

    /**
     * Stock actual de todos los productos de una sucursal, calculado a partir
     * del último movimiento registrado en el ledger (inventory_movements).
     */
    async getStockByCinema(cinemaId: number, filters?: any) {
        const result = await this._inventories.getAllByCinema(cinemaId, {
            ...filters,
            relations: filters?.relations ?? PRODUCT_RELATIONS,
        });

        const rows = Array.isArray(result) ? result : result.rows;
        const populatedRows = await this._populateCurrentStock(rows);

        return Array.isArray(result) ? populatedRows : { count: result.count, rows: populatedRows };
    }

    /**
     * Stock de un único producto en una sucursal específica.
     * Lanza NotFoundError si el producto no tiene registro de inventario
     * en esa sucursal (es decir, nunca se "habilitó" ahí).
     */
    async getProductStockByCinema(cinemaId: number, productId: number) {
        const inventory = await this._inventories.getOne(
            { cinema: cinemaId, product: productId, deleted_at: null },
            { relations: PRODUCT_RELATIONS },
        );
        if (!inventory) throw new NotFoundError('Este producto no tiene inventario registrado en esta sucursal');

        const [populated] = await this._populateCurrentStock([inventory]);
        return populated;
    }

    /**
     * Listado administrativo global: inventario de TODAS las sucursales,
     * con stock actual calculado. Pensado para backoffice (super admin).
     */
    async getAllInventoryAdmin(filters?: any) {
        const result = await this._inventories.getAll(
            { ...filters, count: true, relations: filters?.relations ?? PRODUCT_RELATIONS },
            { deleted_at: null, ...(filters?.where ?? {}) },
        );

        const rows = Array.isArray(result) ? result : result.rows;
        const populatedRows = await this._populateCurrentStock(rows);

        return Array.isArray(result) ? populatedRows : { count: result.count, rows: populatedRows };
    }

    /**
     * Enriquece un listado de registros de inventario con su stock y costo
     * unitario actuales, derivados del último movimiento del ledger.
     */
    private async _populateCurrentStock(rows: any[]) {
        return Promise.all(
            rows.map(async (row: any) => {
                const plainRow = row.toJSON ? row.toJSON() : { ...row };
                const lastMovements = await this._inventoryMovements.getAll(
                    { count: false, limit: 1, order: [['id', 'DESC']] },
                    { inventory: plainRow.id },
                );

                if (lastMovements.length > 0) {
                    plainRow.stock = Number(lastMovements[0].resulting_stock);
                    plainRow.current_unit_cost_base_currency = Number(
                        lastMovements[0].resulting_unit_cost_base_currency,
                    );
                } else {
                    plainRow.stock = 0;
                    plainRow.current_unit_cost_base_currency = 0;
                }

                return plainRow;
            }),
        );
    }

    // -------------------------------------------------------------------------
    //  PROVISIONAMIENTO — HABILITAR UN PRODUCTO EN UNA SUCURSAL
    // -------------------------------------------------------------------------

    /**
     * Habilita un producto (creado a nivel central en `products`) para que
     * exista como registro de inventario en una sucursal específica.
     *
     * Esto NO crea stock por sí solo (queda en 0); el ingreso de stock se
     * hace luego vía registerMovements con un movimiento de tipo "Entrada".
     *
     * Si el producto ya tiene inventario en esa sucursal (incluso "borrado"),
     * lo reactiva en vez de duplicar la fila — respeta el unique constraint
     * (cinema, product).
     */
    async provisionProductInCinema(cinemaId: number, productId: number, minimumStock = 0) {
        if (!Number.isInteger(minimumStock) || minimumStock < 0)
            throw new ValidationError('minimumStock debe ser un entero mayor o igual a 0', ['minimumStock']);

        const product = await this._products.getById(productId);
        if (!product) throw new NotFoundError('Producto no encontrado en el catálogo central');

        const existing = await this._inventories.getOne({ cinema: cinemaId, product: productId }, { paranoid: false });

        if (existing && !existing.deleted_at) {
            throw new ConflictError(
                'Este producto ya está registrado en el inventario de esta sucursal',
                'INVENTORY_ALREADY_PROVISIONED',
            );
        }

        if (existing && existing.deleted_at) {
            await this._inventories.restore(existing.id);
            await this._inventories.update(existing.id, { minimum_stock: minimumStock });
            return this._inventories.getById(existing.id, { relations: PRODUCT_RELATIONS });
        }

        const created = await this._inventories.create({
            cinema: cinemaId,
            product: productId,
            minimum_stock: minimumStock,
        });

        return this._inventories.getById(created.id, { relations: PRODUCT_RELATIONS });
    }

    /**
     * Detalle completo de un registro de inventario: datos del producto,
     * stock/costo actuales (derivados del último movimiento) y el historial
     * completo de movimientos (más reciente primero).
     */
    async getInventoryWithMovements(inventoryId: number) {
        const inventory = await this._inventories.getById(inventoryId, { relations: PRODUCT_RELATIONS });
        if (!inventory) throw new NotFoundError('Registro de inventario no encontrado');

        const movements = await this._inventoryMovements.getAll(
            { count: false, order: [['id', 'DESC']] },
            { inventory: inventoryId },
        );
        const movementList = Array.isArray(movements) ? movements : movements.rows;

        const [populated] = await this._populateCurrentStock([inventory]);

        return { ...populated, movements: movementList };
    }

    // -------------------------------------------------------------------------
    //  ESCRITURA — MOVIMIENTOS DE INVENTARIO
    // -------------------------------------------------------------------------

    async registerMovements(
        inventoryId: number,
        movements: Array<{
            operationType: number;
            quantity: number;
            remarks?: string;
            unit_cost?: number;
            adjustmentDirection?: 'increase' | 'decrease';
        }>,
        userId: number,
    ) {
        if (!Array.isArray(movements) || movements.length === 0)
            throw new ValidationError('Debe enviar al menos un movimiento');

        for (const mov of movements) {
            if (!mov.operationType) throw new ValidationError('Cada movimiento requiere un operationType');
            if (!mov.quantity || mov.quantity <= 0)
                throw new ValidationError('La cantidad debe ser un número positivo');
            if (
                mov.adjustmentDirection !== undefined &&
                mov.adjustmentDirection !== 'increase' &&
                mov.adjustmentDirection !== 'decrease'
            ) {
                throw new ValidationError('adjustmentDirection debe ser "increase" o "decrease"');
            }
        }

        return this._inventories.transaction(async (transaction: Transaction) => {
            const inventory = await this._inventories.getById(inventoryId, {
                transaction,
                lock: transaction.LOCK.UPDATE,
            });
            if (!inventory) throw new NotFoundError('Inventario no encontrado');

            const createdMovements: any[] = [];

            for (const mov of movements) {
                const opType = await this._operationTypes.getById(mov.operationType, { transaction });
                if (!opType) throw new ValidationError(`El tipo de operación con ID ${mov.operationType} no existe`);

                const lastMovements = await this._inventoryMovements.getAll(
                    {
                        count: false,
                        limit: 1,
                        order: [['id', 'DESC']],
                        operation: { transaction, lock: transaction.LOCK.UPDATE },
                    },
                    { inventory: inventoryId },
                );
                const currentStock = lastMovements.length > 0 ? Number(lastMovements[0].resulting_stock) : 0;
                const currentCost =
                    lastMovements.length > 0 ? Number(lastMovements[0].resulting_unit_cost_base_currency) : 0;

                // Determinar si este movimiento suma o resta stock.
                let isIncrement: boolean = opType.is_increment;
                if (mov.adjustmentDirection === 'increase') isIncrement = true;
                if (mov.adjustmentDirection === 'decrease') isIncrement = false;

                let newStock = currentStock;
                let newUnitCost = currentCost;

                if (isIncrement) {
                    newStock += mov.quantity;
                    newUnitCost =
                        newStock > 0
                            ? (currentStock * currentCost + mov.quantity * (mov.unit_cost ?? currentCost)) / newStock
                            : currentCost;
                } else {
                    newStock -= mov.quantity;
                    if (newStock < 0)
                        throw new ValidationError(
                            `El stock resultante no puede ser negativo (stock actual: ${currentStock}, cantidad solicitada: ${mov.quantity})`,
                        );
                }

                const created = await this._inventoryMovements.create(
                    {
                        inventory: inventoryId,
                        operation_type: opType.id,
                        quantity: mov.quantity,
                        unit_cost: mov.unit_cost ?? currentCost,
                        currency: 1,
                        user: userId,
                        remarks: mov.remarks ?? null,
                        resulting_stock: newStock,
                        resulting_unit_cost_base_currency: newUnitCost,
                    },
                    { transaction },
                );

                createdMovements.push(created);
            }

            return createdMovements;
        });
    }
}

export default new InventoryManagementService();
