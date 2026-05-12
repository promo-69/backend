import { DataTypes } from 'sequelize';
import { type RelationsReturn, SequelizeModelBase } from '@database/models/bases/sequelize.model.js';

export default class MoviesModel extends SequelizeModelBase {
	static definition() {
		return {
			id: {
				primaryKey: true,
				autoIncrement: true,
				allowNull: true,
				type: DataTypes.INTEGER,
			},
			title: {
				allowNull: false,
				type: DataTypes.STRING(255),
			},
			duration_minutes: {
				allowNull: false,
				type: DataTypes.INTEGER,
			},
			age_classification: {
				allowNull: false,
				type: DataTypes.INTEGER,
			},
			lifecycle_state: {
				allowNull: false,
				type: DataTypes.INTEGER,
			},
			synopsis: {
				allowNull: false,
				type: DataTypes.TEXT,
			},
			trailer_url: {
				allowNull: true,
				type: DataTypes.STRING(500),
			},
			poster_url: {
				allowNull: true,
				type: DataTypes.STRING(500),
			},
			banner_url: {
				allowNull: true,
				type: DataTypes.STRING(500),
			},
			release_date: {
				allowNull: false,
				type: DataTypes.DATEONLY,
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
			tableName: 'movies',
			appRawName: 'movies',
		};
	}

	static override relations(): RelationsReturn {
		return [
			{
				type: 'belongsTo',
				target: 'AgeClassifications',
				options: { foreignKey: 'age_classification', targetKey: 'id', as: '_AgeClassifications' },
			},
			{
				inversed: true,
				type: 'hasMany',
				target: 'AgeClassifications',
				options: { foreignKey: 'age_classification', targetKey: 'id', as: '_Movies' },
			},
			{
				type: 'belongsTo',
				target: 'MovieLifecycleStates',
				options: { foreignKey: 'lifecycle_state', targetKey: 'id', as: '_LifecycleStates' },
			},
			{
				inversed: true,
				type: 'hasMany',
				target: 'MovieLifecycleStates',
				options: { foreignKey: 'lifecycle_state', targetKey: 'id', as: '_Movies' },
			},
		];
	}
}
