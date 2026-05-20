import { DataTypes } from 'sequelize';
import { type RelationsReturn, SequelizeModelBase } from '@database/models/bases/sequelize.model.js';

export default class RoomBookingsModel extends SequelizeModelBase {
	static definition() {
		return {
			id: {
				primaryKey: true,
				autoIncrement: true,
				allowNull: false,
				type: DataTypes.INTEGER,
			},
			room: {
				allowNull: false,
				type: DataTypes.INTEGER,
			},
			start_time: {
				allowNull: false,
				type: DataTypes.DATE,
			},
			end_time: {
				allowNull: false,
				type: DataTypes.DATE,
			},
			booking_type: {
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
			isBasicTable: false,
			schema: 'public',
			tableName: 'room_bookings',
			appRawName: 'room-bookings',
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
				options: { foreignKey: 'room', targetKey: 'id', as: '_RoomBookings' },
			},
			{
				type: 'belongsTo',
				target: 'BookingTypes',
				options: { foreignKey: 'booking_type', targetKey: 'id', as: '_BookingTypes' },
			},
			{
				inversed: true,
				type: 'hasMany',
				target: 'BookingTypes',
				options: { foreignKey: 'booking_type', targetKey: 'id', as: '_RoomBookings' },
			},
		];
	}
}
