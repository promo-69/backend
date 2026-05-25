import { DataTypes } from 'sequelize';
import { type RelationsReturn, SequelizeModelBase } from '@database/models/bases/sequelize.model.js';

export default class OrdersModel extends SequelizeModelBase {
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
			employee: {
				allowNull: true,
				type: DataTypes.INTEGER,
			},
			cinema: {
				allowNull: false,
				type: DataTypes.INTEGER,
			},
			system_base_currency: {
				allowNull: false,
				type: DataTypes.INTEGER,
			},
			subtotal_base_currency: {
				allowNull: false,
				type: DataTypes.DECIMAL(10, 2),
			},
			tax_amount_base_currency: {
				allowNull: false,
				type: DataTypes.DECIMAL(10, 2),
			},
			total_amount_base_currency: {
				allowNull: false,
				type: DataTypes.DECIMAL(10, 2),
			},
			generated_points: {
				allowNull: false,
				type: DataTypes.INTEGER,
			},
			remarks: {
				allowNull: true,
				type: DataTypes.TEXT,
			},
			qr_code: {
				allowNull: true,
				type: DataTypes.STRING(500),
			},
			tickets_validated_at: {
				allowNull: true,
				type: DataTypes.DATE,
			},
			concessions_validated_at: {
				allowNull: true,
				type: DataTypes.DATE,
			},
			order_status: {
				allowNull: false,
				type: DataTypes.INTEGER,
				defaultValue: 1,
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
			tableName: 'orders',
			appRawName: 'orders',
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
				options: { foreignKey: 'customer', targetKey: 'id', as: '_Orders' },
			},
			{
				type: 'belongsTo',
				target: 'Employees',
				options: { foreignKey: 'employee', targetKey: 'id', as: '_Employees' },
			},
			{
				inversed: true,
				type: 'hasMany',
				target: 'Employees',
				options: { foreignKey: 'employee', targetKey: 'id', as: '_Orders' },
			},
			{
				type: 'belongsTo',
				target: 'Cinemas',
				options: { foreignKey: 'cinema', targetKey: 'id', as: '_Cinemas' },
			},
			{
				inversed: true,
				type: 'hasMany',
				target: 'Cinemas',
				options: { foreignKey: 'cinema', targetKey: 'id', as: '_Orders' },
			},
			{
				type: 'belongsTo',
				target: 'OrderStatuses',
				options: { foreignKey: 'order_status', targetKey: 'id', as: '_OrderStatuses' },
			},
			{
				inversed: true,
				type: 'hasMany',
				target: 'OrderStatuses',
				options: { foreignKey: 'order_status', targetKey: 'id', as: '_Orders' },
			},
			{
				type: 'belongsTo',
				target: 'Currencies',
				options: { foreignKey: 'system_base_currency', targetKey: 'id', as: '_Currencies' },
			},
			{
				inversed: true,
				type: 'hasMany',
				target: 'Currencies',
				options: { foreignKey: 'system_base_currency', targetKey: 'id', as: '_Orders' },
			},
		];
	}
}
