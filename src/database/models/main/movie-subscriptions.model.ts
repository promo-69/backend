import { DataTypes } from 'sequelize';
import { type RelationsReturn, SequelizeModelBase } from '@database/models/bases/sequelize.model.js';

export default class MovieSubscriptionsModel extends SequelizeModelBase {
	static definition() {
		return {
			id: {
				primaryKey: true,
				autoIncrement: true,
				allowNull: true,
				type: DataTypes.INTEGER,
			},
			customer: {
				allowNull: false,
				type: DataTypes.INTEGER,
			},
			movie: {
				allowNull: false,
				type: DataTypes.INTEGER,
			},
			is_notified: {
				allowNull: false,
				type: DataTypes.BOOLEAN,
				defaultValue: false,
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
			tableName: 'movie_subscriptions',
			appRawName: 'movie_subscriptions',
			timestamps: false,
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
				options: { foreignKey: 'customer', targetKey: 'id', as: '_MovieSubscriptions' },
			},
			{
				type: 'belongsTo',
				target: 'Movies',
				options: { foreignKey: 'movie', targetKey: 'id', as: '_Movies' },
			},
			{
				inversed: true,
				type: 'hasMany',
				target: 'Movies',
				options: { foreignKey: 'movie', targetKey: 'id', as: '_MovieSubscriptions' },
			},
		];
	}
}
