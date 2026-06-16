import { DataTypes } from 'sequelize';
import { type RelationsReturn, SequelizeModelBase } from '@database/models/bases/sequelize.model.js';

export default class BankAccountsModel extends SequelizeModelBase {
	static definition() {
		return {
			id: {
				primaryKey: true,
				autoIncrement: true,
				allowNull: false,
				type: DataTypes.INTEGER,
			},
			bank: {
				allowNull: false,
				type: DataTypes.INTEGER,
			},
			currency: {
				allowNull: false,
				type: DataTypes.INTEGER,
			},
			payment_method: {
				allowNull: false,
				type: DataTypes.INTEGER,
			},
			payment_details: {
				allowNull: false,
				type: DataTypes.JSONB,
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
			tableName: 'bank_accounts',
			appRawName: 'bank-accounts',
		};
	}

	static override relations(): RelationsReturn {
		return [
			{
				type: 'belongsTo',
				target: 'Banks',
				options: { foreignKey: 'bank', targetKey: 'id', as: '_Banks' },
			},
			{
				inversed: true,
				type: 'hasMany',
				target: 'Banks',
				options: { foreignKey: 'bank', targetKey: 'id', as: '_BankAccounts' },
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
				options: { foreignKey: 'currency', targetKey: 'id', as: '_BankAccounts' },
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
				options: { foreignKey: 'payment_method', targetKey: 'id', as: '_BankAccounts' },
			},
		];
	}
}
