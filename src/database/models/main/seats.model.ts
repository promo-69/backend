import { DataTypes } from 'sequelize';
import { type RelationsReturn, SequelizeModelBase } from '@database/models/bases/sequelize.model.js';

export default class SeatsModel extends SequelizeModelBase {
	static definition() {
		return {
			id: {
				primaryKey: true,
				autoIncrement: true,
				allowNull: true,
				type: DataTypes.INTEGER,
			},
			room: {
				allowNull: false,
				type: DataTypes.INTEGER,
			},
			row_identifier: {
				allowNull: false,
				type: DataTypes.STRING(2),
			},
			column_number: {
				allowNull: false,
				type: DataTypes.INTEGER,
			},
			seat_category: {
				allowNull: false,
				type: DataTypes.INTEGER,
			},
			seat_condition: {
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
			isBasicTable: true,
			schema: 'public',
			tableName: 'seats',
			appRawName: 'seats',
			timestamps: false,
		};
	}

	static override relations(): RelationsReturn {
		return [
			{
				type: 'belongsTo',
				target: 'Rooms',
				options: { foreignKey: 'room', targetKey: 'id', as: '_Rooms' },
			},
			{
				inversed: true,
				type: 'hasMany',
				target: 'Rooms',
				options: { foreignKey: 'room', targetKey: 'id', as: '_Seats' },
			},
			{
				type: 'belongsTo',
				target: 'SeatCategories',
				options: { foreignKey: 'seat_category', targetKey: 'id', as: '_SeatCategories' },
			},
			{
				inversed: true,
				type: 'hasMany',
				target: 'SeatCategories',
				options: { foreignKey: 'seat_category', targetKey: 'id', as: '_Seats' },
			},
			{
				type: 'belongsTo',
				target: 'SeatConditions',
				options: { foreignKey: 'seat_condition', targetKey: 'id', as: '_SeatConditions' },
			},
			{
				inversed: true,
				type: 'hasMany',
				target: 'SeatConditions',
				options: { foreignKey: 'seat_condition', targetKey: 'id', as: '_Seats' },
			},
		];
	}
}
