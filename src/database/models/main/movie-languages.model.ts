import { DataTypes } from 'sequelize';
import { type RelationsReturn, SequelizeModelBase } from '@database/models/bases/sequelize.model.js';

export default class MovieLanguagesModel extends SequelizeModelBase {
	static definition() {
		return {
			id: {
				primaryKey: true,
				autoIncrement: true,
				allowNull: false,
				type: DataTypes.INTEGER,
			},
			movie: {
				allowNull: false,
				type: DataTypes.INTEGER,
			},
			language: {
				allowNull: false,
				type: DataTypes.INTEGER,
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
			tableName: 'movie_languages',
			appRawName: 'movie-languages',
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
				options: { foreignKey: 'movie', targetKey: 'id', as: '_MovieLanguages' },
			},
			{
				type: 'belongsTo',
				target: 'Languages',
				options: { foreignKey: 'language', targetKey: 'id', as: '_Languages' },
			},
			{
				inversed: true,
				type: 'hasMany',
				target: 'Languages',
				options: { foreignKey: 'language', targetKey: 'id', as: '_MovieLanguages' },
			},
		];
	}
}
