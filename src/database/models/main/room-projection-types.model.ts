import { DataTypes } from 'sequelize';
import { type RelationsReturn, SequelizeModelBase } from '@database/models/bases/sequelize.model.js';

export default class RoomProjectionTypesModel extends SequelizeModelBase {
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
			projection_type: {
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
			tableName: 'room_projection_types',
			appRawName: 'room-projection-types',
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
				options: { foreignKey: 'room', targetKey: 'id', as: '_RoomProjectionTypes' },
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
				options: { foreignKey: 'projection_type', targetKey: 'id', as: '_RoomProjectionTypes' },
			},
		];
	}
}
