import { DataTypes } from 'sequelize';
import { type RelationsReturn, SequelizeModelBase } from '@database/models/bases/sequelize.model.js';

export default class AppliedPriceModifiersModel extends SequelizeModelBase {
	static definition() {
		return {
			id: {
				primaryKey: true,
				autoIncrement: true,
				allowNull: false,
				type: DataTypes.INTEGER,
			},
			price_modifier: {
				allowNull: false,
				type: DataTypes.INTEGER,
			},
			order: {
				allowNull: true,
				type: DataTypes.INTEGER,
			},
			ticket: {
				allowNull: true,
				type: DataTypes.INTEGER,
			},
			order_line: {
				allowNull: true,
				type: DataTypes.INTEGER,
			},
			rental_request: {
				allowNull: true,
				type: DataTypes.INTEGER,
			},
			rental_catering: {
				allowNull: true,
				type: DataTypes.INTEGER,
			},
			applied_amount_base_currency: {
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
			tableName: 'applied_price_modifiers',
			appRawName: 'applied-price-modifiers',
		};
	}

	static override relations(): RelationsReturn {
		return [
			{
				type: 'belongsTo',
				target: 'PriceModifiers',
				options: { foreignKey: 'price_modifier', targetKey: 'id', as: '_PriceModifiers' },
			},
			{
				inversed: true,
				type: 'hasMany',
				target: 'PriceModifiers',
				options: { foreignKey: 'price_modifier', targetKey: 'id', as: '_AppliedPriceModifiers' },
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
				options: { foreignKey: 'order', targetKey: 'id', as: '_AppliedPriceModifiers' },
			},
			{
				type: 'belongsTo',
				target: 'Tickets',
				options: { foreignKey: 'ticket', targetKey: 'id', as: '_Tickets' },
			},
			{
				inversed: true,
				type: 'hasMany',
				target: 'Tickets',
				options: { foreignKey: 'ticket', targetKey: 'id', as: '_AppliedPriceModifiers' },
			},
			{
				type: 'belongsTo',
				target: 'OrderLines',
				options: { foreignKey: 'order_line', targetKey: 'id', as: '_OrderLines' },
			},
			{
				inversed: true,
				type: 'hasMany',
				target: 'OrderLines',
				options: { foreignKey: 'order_line', targetKey: 'id', as: '_AppliedPriceModifiers' },
			},
			{
				type: 'belongsTo',
				target: 'RentalRequests',
				options: { foreignKey: 'rental_request', targetKey: 'id', as: '_RentalRequests' },
			},
			{
				inversed: true,
				type: 'hasMany',
				target: 'RentalRequests',
				options: { foreignKey: 'rental_request', targetKey: 'id', as: '_AppliedPriceModifiers' },
			},
			{
				type: 'belongsTo',
				target: 'RentalCatering',
				options: { foreignKey: 'rental_catering', targetKey: 'id', as: '_RentalCatering' },
			},
			{
				inversed: true,
				type: 'hasMany',
				target: 'RentalCatering',
				options: { foreignKey: 'rental_catering', targetKey: 'id', as: '_AppliedPriceModifiers' },
			},
		];
	}
}
