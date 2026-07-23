import { DataTypes } from 'sequelize';
import { type RelationsReturn, SequelizeModelBase } from '@database/models/bases/sequelize.model.js';

export default class BlankTicketsModel extends SequelizeModelBase {
	static definition() {
		return {
			id: {
				primaryKey: true,
				autoIncrement: true,
				allowNull: false,
				type: DataTypes.INTEGER,
			},
			code: {
				allowNull: false,
				unique: true,
				type: DataTypes.STRING(20),
			},
			reward: {
				allowNull: true,
				type: DataTypes.INTEGER,
			},
			customer: {
				allowNull: false,
				type: DataTypes.INTEGER,
			},
			issue_order: {
				allowNull: false,
				type: DataTypes.INTEGER,
			},
			issued_at: {
				allowNull: false,
				type: DataTypes.DATE,
			},
			expires_at: {
				allowNull: false,
				type: DataTypes.DATE,
			},
			status: {
				allowNull: false,
				type: DataTypes.STRING(20),
				defaultValue: 'ISSUED',
			},
			redeemed_order: {
				allowNull: true,
				type: DataTypes.INTEGER,
			},
			redeemed_at: {
				allowNull: true,
				type: DataTypes.DATE,
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
			tableName: 'blank_tickets',
			appRawName: 'blank-tickets',
		};
	}

	static override relations(): RelationsReturn {
		return [
			{
				type: 'belongsTo',
				target: 'LoyaltyRewards',
				options: { foreignKey: 'reward', targetKey: 'id', as: '_LoyaltyRewards' },
			},
			{
				inversed: true,
				type: 'hasMany',
				target: 'LoyaltyRewards',
				options: { foreignKey: 'reward', targetKey: 'id', as: '_BlankTickets' },
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
				options: { foreignKey: 'customer', targetKey: 'id', as: '_BlankTickets' },
			},
			{
				type: 'belongsTo',
				target: 'Orders',
				options: { foreignKey: 'issue_order', targetKey: 'id', as: '_IssueOrder' },
			},
			{
				type: 'belongsTo',
				target: 'Orders',
				options: { foreignKey: 'redeemed_order', targetKey: 'id', as: '_RedeemedOrder' },
			},
		];
	}
}
