import { DataTypes } from 'sequelize';
import { type RelationsReturn, SequelizeModelBase } from '@database/models/bases/sequelize.model.js';

export default class InventoryMovementsModel extends SequelizeModelBase {
	static definition() {
		return {
			id: {
				primaryKey: true,
				autoIncrement: true,
				allowNull: true,
				type: DataTypes.INTEGER,
			},
			inventory: {
				allowNull: false,
				type: DataTypes.INTEGER,
			},
			operation_type: {
				allowNull: false,
				type: DataTypes.INTEGER,
			},
			quantity: {
				allowNull: false,
				type: DataTypes.INTEGER,
			},
			unit_cost: {
				allowNull: false,
				type: DataTypes.DECIMAL(10, 2),
				defaultValue: 0,
			},
			currency: {
				allowNull: false,
				type: DataTypes.INTEGER,
				defaultValue: 1,
			},
			user: {
				allowNull: false,
				type: DataTypes.INTEGER,
			},
			created_at: {
				allowNull: false,
				type: DataTypes.DATE,
				defaultValue: DataTypes.NOW,
			},
			remarks: {
				allowNull: true,
				type: DataTypes.STRING(255),
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
			isBasicTable: true,
			schema: 'public',
			tableName: 'inventory_movements',
			appRawName: 'inventory-movements',
		};
	}

	static override relations(): RelationsReturn {
		return [
			{
				type: 'belongsTo',
				target: 'Inventories',
				options: { foreignKey: 'inventory', targetKey: 'id', as: '_Inventories' },
			},
			{
				inversed: true,
				type: 'hasMany',
				target: 'Inventories',
				options: { foreignKey: 'inventory', targetKey: 'id', as: '_InventoryMovements' },
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
				options: { foreignKey: 'operation_type', targetKey: 'id', as: '_InventoryMovements' },
			},
			{
				type: 'belongsTo',
				target: 'Currencies',
				options: { foreignKey: 'currency', targetKey: 'id', as: '_Currencies' },
			},
			{
				inversed: true,
				type: 'hasMany',
				target: 'Currencies',
				options: { foreignKey: 'currency', targetKey: 'id', as: '_InventoryMovements' },
			},
			{
				type: 'belongsTo',
				target: 'Users',
				options: { foreignKey: 'user', targetKey: 'id', as: '_Users' },
			},
			{
				inversed: true,
				type: 'hasMany',
				target: 'Users',
				options: { foreignKey: 'user', targetKey: 'id', as: '_InventoryMovements' },
			},
		];
	}
}
