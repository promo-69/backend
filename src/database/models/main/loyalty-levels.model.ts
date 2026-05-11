import { DataTypes } from 'sequelize';
import { type RelationsReturn, SequelizeModelBase } from '@database/models/bases/sequelize.model.js';

export default class LoyaltyLevelsModel extends SequelizeModelBase {
	static definition() {
		return {
			id: {
				primaryKey: true,
				autoIncrement: true,
				allowNull: true,
				type: DataTypes.INTEGER,
			},
			name: {
				allowNull: false,
				type: DataTypes.STRING(100),
			},
			required_points: {
				allowNull: true,
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
			isBasicTable: true,
			schema: 'public',
			tableName: 'loyalty_levels',
			appRawName: 'loyalty_levels',
			timestamps: false,
		};
	}

	static override relations(): RelationsReturn {
		return [];
	}
}
