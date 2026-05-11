import { DataTypes } from 'sequelize';
import { type RelationsReturn, SequelizeModelBase } from '@database/models/bases/sequelize.model.js';

export default class InvoicesModel extends SequelizeModelBase {
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
			invoice_number: {
				allowNull: false,
				type: DataTypes.STRING(100),
			},
			billing_document: {
				allowNull: false,
				type: DataTypes.STRING(100),
			},
			billing_name: {
				allowNull: false,
				type: DataTypes.STRING(255),
			},
			billing_address: {
				allowNull: true,
				type: DataTypes.TEXT,
			},
			issued_at: {
				allowNull: false,
				type: DataTypes.DATE,
				defaultValue: DataTypes.NOW,
			},
			deleted_at: {
				allowNull: true,
				type: DataTypes.DATE,
			},
		};
	}

	static config() {
		return {
			isBasicTable: true,
			schema: 'public',
			tableName: 'invoices',
			appRawName: 'invoices',
			timestamps: false,
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
				options: { foreignKey: 'order', targetKey: 'id', as: '_Invoices' },
			},
		];
	}
}
