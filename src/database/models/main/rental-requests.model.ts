import { DataTypes } from 'sequelize';
import { type RelationsReturn, SequelizeModelBase } from '@database/models/bases/sequelize.model.js';

export default class RentalRequestsModel extends SequelizeModelBase {
	static definition() {
		return {
			id: {
				primaryKey: true,
				autoIncrement: true,
				allowNull: true,
				type: DataTypes.INTEGER,
			},
			event_type: {
				allowNull: false,
				type: DataTypes.INTEGER,
			},
			cinema: {
				allowNull: false,
				type: DataTypes.INTEGER,
			},
			customer: {
				allowNull: true,
				type: DataTypes.INTEGER,
			},
			contact_name: {
				allowNull: false,
				type: DataTypes.STRING(255),
			},
			contact_email: {
				allowNull: false,
				type: DataTypes.STRING(255),
			},
			contact_phone: {
				allowNull: false,
				type: DataTypes.STRING(50),
			},
			event_date: {
				allowNull: false,
				type: DataTypes.DATE,
			},
			attendees: {
				allowNull: false,
				type: DataTypes.INTEGER,
			},
			created_at: {
				allowNull: false,
				type: DataTypes.DATE,
				defaultValue: DataTypes.NOW,
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
			tableName: 'rental_requests',
			appRawName: 'rental_requests',
			timestamps: false,
		};
	}

	static override relations(): RelationsReturn {
		return [
			{
				type: 'belongsTo',
				target: 'EventTypes',
				options: { foreignKey: 'event_type', targetKey: 'id', as: '_EventTypes' },
			},
			{
				inversed: true,
				type: 'hasMany',
				target: 'EventTypes',
				options: { foreignKey: 'event_type', targetKey: 'id', as: '_RentalRequests' },
			},
			{
				type: 'belongsTo',
				target: 'Cinemas',
				options: { foreignKey: 'cinema', targetKey: 'id', as: '_Cinemas' },
			},
			{
				inversed: true,
				type: 'hasMany',
				target: 'Cinemas',
				options: { foreignKey: 'cinema', targetKey: 'id', as: '_RentalRequests' },
			},
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
		];
	}
}
