import { DataTypes } from 'sequelize';
import { type RelationsReturn, SequelizeModelBase } from '@database/models/bases/sequelize.model.js';

export default class OrderTaxesModel extends SequelizeModelBase {
	static definition() {
		return {
			id: {
				primaryKey: true,
				autoIncrement: true,
				allowNull: true,
				type: DataTypes.INTEGER,
			},
			order: {
				allowNull: false,
				type: DataTypes.INTEGER,
			},
			tax: {
				allowNull: false,
				type: DataTypes.INTEGER,
			},
			applied_rate: {
				allowNull: false,
				type: DataTypes.DECIMAL(10, 2),
			},
			tax_amount_base_currency: {
				allowNull: false,
				type: DataTypes.DECIMAL(10, 2),
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
			isBasicTable: true,
			schema: 'public',
			tableName: 'order_taxes',
			appRawName: 'order_taxes',
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
				options: { foreignKey: 'order', targetKey: 'id', as: '_OrderTaxes' },
			},
			{
				type: 'belongsTo',
				target: 'Taxes',
				options: { foreignKey: 'tax', targetKey: 'id', as: '_Taxes' },
			},
			{
				inversed: true,
				type: 'hasMany',
				target: 'Taxes',
				options: { foreignKey: 'tax', targetKey: 'id', as: '_OrderTaxes' },
			},
		];
	}
}
