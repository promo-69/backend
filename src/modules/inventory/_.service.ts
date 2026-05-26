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
		if (!cinemaId || Number.isNaN(cinemaId)) {
			throw new ValidationError('El cinemaId no es válido');
		}

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

	async getInventoryDetail(inventoryId: number, cinemaId?: number) {
		const inv = await this._inventories.getById(inventoryId, {
			relations: [
				{
					association: '_Product',
					attributes: ['id', 'name', 'sku', 'price', 'image_url'],
					include: [{ association: '_ProductCategory', attributes: ['id', 'description'] }],
				},
			],
		});
		if (!inv || (cinemaId !== undefined && inv.cinema !== cinemaId))
			throw new NotFoundError('Registro de inventario no encontrado');

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
		movements: Array<{ operationType: number; quantity: number; remarks?: string }>,
		userId: number,
		cinemaId?: number,
	) {
		if (!inventoryId || Number.isNaN(inventoryId)) {
			throw new ValidationError('El id de inventario no es válido');
		}

		if (!Array.isArray(movements) || movements.length === 0) {
			throw new ValidationError('Debe enviar al menos un movimiento');
		}

		await this._inventories.transaction(async (transaction: Transaction) => {
			const inventory = await this._inventories.getById(inventoryId, {
				transaction,
				lock: transaction.LOCK.UPDATE,
			});
			if (!inventory || (cinemaId !== undefined && inventory.cinema !== cinemaId))
				throw new NotFoundError('Inventario no encontrado');

			let newStock = Number(inventory.stock) || 0;

			for (const mov of movements) {
				if (!mov.quantity || mov.quantity <= 0) {
					throw new ValidationError('La cantidad de cada movimiento debe ser un número positivo');
				}

				// Búsqueda por id (integer)
				const opType = await this._operationTypes.getById(mov.operationType, { transaction });
				if (!opType) {
					throw new ValidationError(
						`El tipo de operación con ID ${mov.operationType} no existe en el sistema`,
					);
				}

				const delta = opType.is_increment ? mov.quantity : -mov.quantity;
				newStock += delta;

				if (newStock < 0) {
					throw new ValidationError(
						'El stock resultante no puede ser negativo. Verifica las cantidades de salida',
					);
				}

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
