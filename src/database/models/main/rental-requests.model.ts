import { DataTypes } from 'sequelize';
import { type RelationsReturn, SequelizeModelBase } from '@database/models/bases/sequelize.model.js';

export default class RentalRequestsModel extends SequelizeModelBase {
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
			order: {
				allowNull: true,
				type: DataTypes.INTEGER,
			},
			booking: {
				allowNull: true,
				type: DataTypes.INTEGER,
			},
			room: {
				allowNull: false,
				type: DataTypes.INTEGER,
			},
			event_type: {
				allowNull: false,
				type: DataTypes.INTEGER,
			},
			requested_start_time: {
				allowNull: false,
				type: DataTypes.DATE,
			},
			requested_end_time: {
				allowNull: false,
				type: DataTypes.DATE,
			},
			event_name: {
				allowNull: false,
				type: DataTypes.STRING(255),
			},
			event_description: {
				allowNull: true,
				type: DataTypes.TEXT,
			},
			status: {
				allowNull: false,
				type: DataTypes.INTEGER,
			},
			currency: {
				allowNull: true,
				type: DataTypes.INTEGER,
			},
			price: {
				allowNull: true,
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
			tableName: 'rental_requests',
			appRawName: 'rental-requests',
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
				inversed: true,
				type: 'hasMany',
				target: 'Customers',
				options: { foreignKey: 'customer', targetKey: 'id', as: '_RentalRequests' },
			},
			{
				type: 'belongsTo',
				target: 'Orders',
				options: { foreignKey: 'order', targetKey: 'id', as: '_Orders' },
			},
			{
				inversed: true,
				type: 'hasMany',
				target: 'Orders',
				options: { foreignKey: 'order', targetKey: 'id', as: '_RentalRequests' },
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
				options: { foreignKey: 'booking', targetKey: 'id', as: '_RentalRequests' },
			},
			{
				type: 'belongsTo',
				target: 'Rooms',
				options: { foreignKey: 'room', targetKey: 'id', as: '_Rooms' },
			},
			{
				inversed: true,
				type: 'hasMany',
				target: 'Rooms',
				options: { foreignKey: 'room', targetKey: 'id', as: '_RentalRequests' },
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
				options: { foreignKey: 'event_type', targetKey: 'id', as: '_RentalRequests' },
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
				options: { foreignKey: 'currency', targetKey: 'id', as: '_RentalRequests' },
			},
		];
	}
}
