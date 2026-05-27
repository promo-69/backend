import { DataTypes } from 'sequelize';
import { type RelationsReturn, SequelizeModelBase } from '@database/models/bases/sequelize.model.js';

export default class OrderLinesModel extends SequelizeModelBase {
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
			line_type: {
				allowNull: false,
				type: DataTypes.INTEGER,
			},
			product: {
				allowNull: true,
				type: DataTypes.INTEGER,
			},
			combo: {
				allowNull: true,
				type: DataTypes.INTEGER,
			},
			quantity: {
				allowNull: false,
				type: DataTypes.INTEGER,
			},
			original_unit_price: {
				allowNull: false,
				type: DataTypes.DECIMAL(10, 2),
			},
			unit_price: {
				allowNull: false,
				type: DataTypes.DECIMAL(10, 2),
			},
			quoted_exchange_rate: {
				allowNull: false,
				type: DataTypes.INTEGER,
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
			createdAt: false,
			updatedAt: false,
			deletedAt: 'deleted_at',
			isBasicTable: false,
			schema: 'public',
			tableName: 'order_lines',
			appRawName: 'order-lines',
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
				options: { foreignKey: 'order', targetKey: 'id', as: '_OrderLines' },
			},
			{
				type: 'belongsTo',
				target: 'LineTypes',
				options: { foreignKey: 'line_type', targetKey: 'id', as: '_LineTypes' },
			},
			{
				inversed: true,
				type: 'hasMany',
				target: 'LineTypes',
				options: { foreignKey: 'line_type', targetKey: 'id', as: '_OrderLines' },
			},
			{
				type: 'belongsTo',
				target: 'Products',
				options: { foreignKey: 'product', targetKey: 'id', as: '_Products' },
			},
			{
				inversed: true,
				type: 'hasMany',
				target: 'Products',
				options: { foreignKey: 'product', targetKey: 'id', as: '_OrderLines' },
			},
			{
				type: 'belongsTo',
				target: 'Combos',
				options: { foreignKey: 'combo', targetKey: 'id', as: '_Combos' },
			},
			{
				inversed: true,
				type: 'hasMany',
				target: 'Combos',
				options: { foreignKey: 'combo', targetKey: 'id', as: '_OrderLines' },
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
				options: { foreignKey: 'quoted_exchange_rate', targetKey: 'id', as: '_OrderLines' },
			},
		];
	}
}
