import { DataTypes } from 'sequelize';
import { type RelationsReturn, SequelizeModelBase } from '@database/models/bases/sequelize.model.js';

export default class CombosModel extends SequelizeModelBase {
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
				type: DataTypes.STRING(255),
			},
			sku: {
				allowNull: false,
				type: DataTypes.STRING(100),
			},
			description: {
				allowNull: false,
				type: DataTypes.STRING(255),
			},
			currency: {
				allowNull: false,
				type: DataTypes.INTEGER,
			},
			price: {
				allowNull: false,
				type: DataTypes.DECIMAL(10, 2),
			},
			earned_loyalty_points: {
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
			timestamps: true,
			paranoid: true,
			createdAt: false,
			updatedAt: false,
			deletedAt: 'deleted_at',
			isBasicTable: true,
			schema: 'public',
			tableName: 'combos',
			appRawName: 'combos',
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
				options: { foreignKey: 'currency', targetKey: 'id', as: '_Combos' },
			},
		];
	}
}
