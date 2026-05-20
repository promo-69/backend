import { DataTypes } from 'sequelize';
import { type RelationsReturn, SequelizeModelBase } from '@database/models/bases/sequelize.model.js';

export default class LoyaltyLedgersModel extends SequelizeModelBase {
	static definition() {
		return {
			id: {
				primaryKey: true,
				autoIncrement: true,
				allowNull: false,
				type: DataTypes.INTEGER,
			},
			customer: {
				allowNull: false,
				type: DataTypes.INTEGER,
			},
			order: {
				allowNull: true,
				type: DataTypes.INTEGER,
			},
			operation_type: {
				allowNull: false,
				type: DataTypes.INTEGER,
			},
			points: {
				allowNull: false,
				type: DataTypes.INTEGER,
			},
			points_balance: {
				allowNull: false,
				type: DataTypes.INTEGER,
				defaultValue: 0,
			},
			remarks: {
				allowNull: true,
				type: DataTypes.TEXT,
			},
			deleted_at: {
				allowNull: true,
				type: DataTypes.DATE,
			},
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
			tableName: 'loyalty_ledgers',
			appRawName: 'loyalty-ledgers',
		};
	}

	static override relations(): RelationsReturn {
		return [
			{
				type: 'belongsTo',
				target: 'Customers',
				options: { foreignKey: 'customer', targetKey: 'id', as: '_Customers' },
			},
			{
				inversed: true,
				type: 'hasMany',
				target: 'Customers',
				options: { foreignKey: 'customer', targetKey: 'id', as: '_LoyaltyLedgers' },
			},
			{
				type: 'belongsTo',
				target: 'Orders',
				options: { foreignKey: 'order', targetKey: 'id', as: '_Orders' },
			},
			{
				inversed: true,
				type: 'hasMany',
				target: 'Orders',
				options: { foreignKey: 'order', targetKey: 'id', as: '_LoyaltyLedgers' },
			},
			{
				type: 'belongsTo',
				target: 'OperationTypes',
				options: { foreignKey: 'operation_type', targetKey: 'id', as: '_OperationTypes' },
			},
			{
				inversed: true,
				type: 'hasMany',
				target: 'OperationTypes',
				options: { foreignKey: 'operation_type', targetKey: 'id', as: '_LoyaltyLedgers' },
			},
		];
	}
}
