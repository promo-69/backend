import { DataTypes } from 'sequelize';
import { type RelationsReturn, SequelizeModelBase } from '@database/models/bases/sequelize.model.js';

export default class MovieGenresModel extends SequelizeModelBase {
	static definition() {
		return {
			id: {
				primaryKey: true,
				autoIncrement: true,
				allowNull: true,
				type: DataTypes.INTEGER,
			},
			movie: {
				allowNull: false,
				type: DataTypes.INTEGER,
			},
			genre: {
				allowNull: false,
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
			tableName: 'movie_genres',
			appRawName: 'movie-genres',
		};
	}

	static override relations(): RelationsReturn {
		return [
			{
				type: 'belongsTo',
				target: 'Movies',
				options: { foreignKey: 'movie', targetKey: 'id', as: '_Movies' },
			},
			{
				inversed: true,
				type: 'hasMany',
				target: 'Movies',
				options: { foreignKey: 'movie', targetKey: 'id', as: '_MovieGenres' },
			},
			{
				type: 'belongsTo',
				target: 'Genres',
				options: { foreignKey: 'genre', targetKey: 'id', as: '_Genres' },
			},
			{
				inversed: true,
				type: 'hasMany',
				target: 'Genres',
				options: { foreignKey: 'genre', targetKey: 'id', as: '_MovieGenres' },
			},
		];
	}
}
