import { DataTypes } from 'sequelize';
import { type RelationsReturn, SequelizeModelBase } from '@database/models/bases/sequelize.model.js';

export default class OrderPaymentsModel extends SequelizeModelBase {
	static definition() {
		return {
			id: {
				primaryKey: true,
				autoIncrement: true,
				allowNull: false,
				type: DataTypes.INTEGER,
			},
			order: {
				allowNull: false,
				type: DataTypes.INTEGER,
			},
			payment_method: {
				allowNull: false,
				type: DataTypes.INTEGER,
			},
			amount: {
				allowNull: false,
				type: DataTypes.DECIMAL(10, 2),
			},
			quoted_exchange_rate: {
				allowNull: false,
				type: DataTypes.INTEGER,
			},
			reference_number: {
				allowNull: true,
				type: DataTypes.STRING(255),
			},
			is_approved: {
				allowNull: false,
				type: DataTypes.BOOLEAN,
			},
			deleted_at: {
				allowNull: true,
				type: DataTypes.DATE,
			}
		};
	}

	static config() {
		return {
			timestamps: true,
			paranoid: true,
			createdAt: 'created_at',
			updatedAt: false,
			deletedAt: 'deleted_at',
			isBasicTable: false,
			schema: 'public',
			tableName: 'order_payments',
			appRawName: 'order-payments',
		};
	}

	static override relations(): RelationsReturn {
		return [
			{
				type: 'belongsTo',
				target: 'Orders',
				options: { foreignKey: 'order', targetKey: 'id', as: '_Orders' },
			},
			{
				inversed: true,
				type: 'hasMany',
				target: 'Orders',
				options: { foreignKey: 'order', targetKey: 'id', as: '_OrderPayments' },
			},
			{
				type: 'belongsTo',
				target: 'PaymentMethods',
				options: { foreignKey: 'payment_method', targetKey: 'id', as: '_PaymentMethods' },
			},
			{
				inversed: true,
				type: 'hasMany',
				target: 'PaymentMethods',
				options: { foreignKey: 'payment_method', targetKey: 'id', as: '_OrderPayments' },
			},
			{
				type: 'belongsTo',
				target: 'ExchangeRates',
				options: { foreignKey: 'quoted_exchange_rate', targetKey: 'id', as: '_ExchangeRates' },
			},
			{
				inversed: true,
				type: 'hasMany',
				target: 'ExchangeRates',
				options: { foreignKey: 'quoted_exchange_rate', targetKey: 'id', as: '_OrderPayments' },
			},
		];
	}
}
