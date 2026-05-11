import { DataTypes } from 'sequelize';
import { type RelationsReturn, SequelizeModelBase } from '@database/models/bases/sequelize.model.js';

export default class ExchangeRatesModel extends SequelizeModelBase {
	static definition() {
		return {
			id: {
				primaryKey: true,
				autoIncrement: true,
				allowNull: true,
				type: DataTypes.INTEGER,
			},
			currency: {
				allowNull: false,
				type: DataTypes.INTEGER,
			},
			rate: {
				allowNull: false,
				type: DataTypes.DECIMAL(10, 2),
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
			tableName: 'exchange_rates',
			appRawName: 'exchange_rates',
			timestamps: false,
		};
	}

	static override relations(): RelationsReturn {
		return [
			{
				type: 'belongsTo',
				target: 'Currencies',
				options: { foreignKey: 'currency', targetKey: 'id', as: '_Currencies' },
			},
			{
				inversed: true,
				type: 'hasMany',
				target: 'Currencies',
				options: { foreignKey: 'currency', targetKey: 'id', as: '_ExchangeRates' },
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
				options: { foreignKey: 'user', targetKey: 'id', as: '_ExchangeRates' },
			},
		];
	}
}
