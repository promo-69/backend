import { DataTypes } from 'sequelize';
import { type RelationsReturn, SequelizeModelBase } from '@database/models/bases/sequelize.model.js';

export default class SpecialEventsModel extends SequelizeModelBase {
	static definition() {
		return {
			id: {
				primaryKey: true,
				autoIncrement: true,
				allowNull: false,
				type: DataTypes.INTEGER,
			},
			title: {
				allowNull: false,
				type: DataTypes.STRING(255),
			},
			description: {
				allowNull: false,
				type: DataTypes.TEXT,
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
			trailer_url: {
				allowNull: true,
				type: DataTypes.STRING(255),
			},
			poster_url: {
				allowNull: true,
				type: DataTypes.STRING(255),
			},
			banner_url: {
				allowNull: true,
				type: DataTypes.STRING(255),
			},
			release_date: {
				allowNull: false,
				type: DataTypes.DATEONLY,
			},
			end_date: {
				allowNull: true,
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
			createdAt: 'created_at',
			updatedAt: 'updated_at',
			deletedAt: 'deleted_at',
			isBasicTable: false,
			schema: 'public',
			tableName: 'special_events',
			appRawName: 'special-events',
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
				options: { foreignKey: 'age_classification', targetKey: 'id', as: '_SpecialEvents' },
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
				options: { foreignKey: 'lifecycle_state', targetKey: 'id', as: '_SpecialEvents' },
			},
		];
	}
}
