import { DataTypes } from 'sequelize';
import { type RelationsReturn, SequelizeModelBase } from '@database/models/bases/sequelize.model.js';

export default class ShowtimesModel extends SequelizeModelBase {
	static definition() {
		return {
			id: {
				primaryKey: true,
				autoIncrement: true,
				allowNull: false,
				type: DataTypes.INTEGER,
			},
			booking: {
				allowNull: false,
				type: DataTypes.INTEGER,
			},
			movie: {
				allowNull: false,
				type: DataTypes.INTEGER,
			},
			projection_type: {
				allowNull: false,
				type: DataTypes.INTEGER,
			},
			language: {
				allowNull: false,
				type: DataTypes.INTEGER,
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
			isBasicTable: false,
			schema: 'public',
			tableName: 'showtimes',
			appRawName: 'showtimes',
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
				options: { foreignKey: 'movie', targetKey: 'id', as: '_Showtimes' },
			},
			{
				type: 'belongsTo',
				target: 'RoomBookings',
				options: { foreignKey: 'booking', targetKey: 'id', as: '_RoomBookings' },
			},
			{
				inversed: true,
				type: 'hasMany',
				target: 'RoomBookings',
				options: { foreignKey: 'booking', targetKey: 'id', as: '_Showtimes' },
			},
			{
				type: 'belongsTo',
				target: 'ProjectionTypes',
				options: { foreignKey: 'projection_type', targetKey: 'id', as: '_ProjectionTypes' },
			},
			{
				inversed: true,
				type: 'hasMany',
				target: 'ProjectionTypes',
				options: { foreignKey: 'projection_type', targetKey: 'id', as: '_Showtimes' },
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
				options: { foreignKey: 'language', targetKey: 'id', as: '_Showtimes' },
			},
			{
				type: 'belongsTo',
				target: 'Currencies',
				options: { foreignKey: 'currency', targetKey: 'id', as: '_Currencies' },
			},
			{
				inversed: true,
				type: 'hasMany',
				target: 'Currencies',
				options: { foreignKey: 'currency', targetKey: 'id', as: '_Showtimes' },
			},
		];
	}
}
