import { BaseService } from '@bases/service.base.js';
import { Database } from '@database/index.js';
import { NotFoundError, ValidationError } from '@errors';
import { type Transaction } from 'sequelize';

export class CustomersService extends BaseService {
	constructor() {
		super();
	}

	private get _customers() {
		return Database.repository('main', 'customers') as any;
	}
	private get _loyaltyLedgers() {
		return Database.repository('main', 'loyalty-ledgers') as any;
	}

	// --- Soporte Operativo: Ajuste manual de puntos de lealtad ---
	async adjustLoyaltyPoints(customerId: number, body: { operationType: number; points: number }) {
		const { operationType, points } = body;

		this.validateRequired({ operationType, points } as any, ['operationType', 'points']);

		if (!Number.isInteger(points) || points <= 0)
			throw new ValidationError('Los puntos deben ser un entero positivo', ['points']);

		const customer = await this._customers.getOne({ id: customerId });
		if (!customer) throw new NotFoundError('Cliente no encontrado');

		// operationType 1 = suma, 2 = resta (según seeder de operation_types)
		const isIncrement = operationType === 1;
		const delta = isIncrement ? points : -points;
		const newTotal = (customer.level_progress_points ?? 0) + delta;

		await this._customers.transaction(async (transaction: Transaction) => {
			// Insertar registro en el ledger
			await this._loyaltyLedgers.create(
				{
					customer: customerId,
					order: null,
					operationType,
					points,
				},
				{ transaction },
			);

			// Actualizar total en customers
			await this._customers.update(
				customerId,
				{ level_progress_points: newTotal < 0 ? 0 : newTotal },
				{ transaction },
			);
		});

		return null;
	}
}

export default new CustomersService();
