import { DataTypes } from 'sequelize';
import { type RelationsReturn, SequelizeModelBase } from '@database/models/bases/sequelize.model.js';

export default class CustomerFavoriteGenresModel extends SequelizeModelBase {
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
			genre: {
				allowNull: false,
				type: DataTypes.INTEGER,
			},
			created_at: {
				allowNull: false,
				type: DataTypes.DATE,
			},
		};
	}

	static config() {
		return {
			timestamps: true,
			paranoid: false,
			createdAt: 'created_at',
			updatedAt: false,
			isBasicTable: false,
			schema: 'public',
			tableName: 'customer_favorite_genres',
			appRawName: 'customer-favorite-genres',
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
				type: 'belongsTo',
				target: 'Genres',
				options: { foreignKey: 'genre', targetKey: 'id', as: '_Genres' },
			},
		];
	}
}
