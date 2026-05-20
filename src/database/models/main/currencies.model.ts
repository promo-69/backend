import { DataTypes } from 'sequelize';
import { type RelationsReturn, SequelizeModelBase } from '@database/models/bases/sequelize.model.js';

export default class CurrenciesModel extends SequelizeModelBase {
	static definition() {
		return {
			id: {
				primaryKey: true,
				autoIncrement: true,
				allowNull: false,
				type: DataTypes.INTEGER,
			},
			code: {
				allowNull: false,
				type: DataTypes.STRING(10),
			},
			description: {
				allowNull: false,
				type: DataTypes.STRING(255),
			},
			symbol: {
				allowNull: false,
				type: DataTypes.STRING(10),
			},
			is_base_currency: {
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
			createdAt: false,
			updatedAt: false,
			deletedAt: 'deleted_at',
			isBasicTable: false,
			schema: 'public',
			tableName: 'currencies',
			appRawName: 'currencies',
		};
	}

	static override relations(): RelationsReturn {
		return [];
	}
}
