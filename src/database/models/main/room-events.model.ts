import { DataTypes } from 'sequelize';
import { type RelationsReturn, SequelizeModelBase } from '@database/models/bases/sequelize.model.js';

export default class RoomEventsModel extends SequelizeModelBase {
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
			event_type: {
				allowNull: false,
				type: DataTypes.INTEGER,
			},
			name: {
				allowNull: false,
				type: DataTypes.STRING(255),
			},
			organizer: {
				allowNull: true,
				type: DataTypes.STRING(255),
			},
			description: {
				allowNull: true,
				type: DataTypes.TEXT,
			},
			currency: {
				allowNull: false,
				type: DataTypes.INTEGER,
			},
			price: {
				allowNull: false,
				type: DataTypes.DECIMAL(10, 2),
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
			tableName: 'room_events',
			appRawName: 'room-events',
		};
	}

	static override relations(): RelationsReturn {
		return [
			{
				type: 'belongsTo',
				target: 'RoomBookings',
				options: { foreignKey: 'booking', targetKey: 'id', as: '_RoomBookings' },
			},
			{
				inversed: true,
				type: 'hasMany',
				target: 'RoomBookings',
				options: { foreignKey: 'booking', targetKey: 'id', as: '_RoomEvents' },
			},
			{
				type: 'belongsTo',
				target: 'BookingTypes',
				options: { foreignKey: 'event_type', targetKey: 'id', as: '_BookingTypes' },
			},
			{
				inversed: true,
				type: 'hasMany',
				target: 'BookingTypes',
				options: { foreignKey: 'event_type', targetKey: 'id', as: '_RoomEvents' },
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
				options: { foreignKey: 'currency', targetKey: 'id', as: '_RoomEvents' },
			},
		];
	}
}
