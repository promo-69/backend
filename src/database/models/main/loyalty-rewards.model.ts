import { DataTypes } from 'sequelize';
import { type RelationsReturn, SequelizeModelBase } from '@database/models/bases/sequelize.model.js';

export default class LoyaltyRewardsModel extends SequelizeModelBase {
	static definition() {
		return {
			id: {
				primaryKey: true,
				autoIncrement: true,
				allowNull: false,
				type: DataTypes.INTEGER,
			},
			name: {
				allowNull: false,
				type: DataTypes.STRING(150),
			},
			description: {
				allowNull: true,
				type: DataTypes.TEXT,
			},
			image_url: {
				allowNull: true,
				type: DataTypes.STRING(255),
			},
			points_cost: {
				allowNull: false,
				type: DataTypes.INTEGER,
			},
			required_loyalty_level: {
				allowNull: false,
				type: DataTypes.INTEGER,
			},
			cinema: {
				allowNull: false,
				type: DataTypes.INTEGER,
			},
			reward_type: {
				allowNull: false,
				type: DataTypes.STRING(30),
			},
			product: {
				allowNull: true,
				type: DataTypes.INTEGER,
			},
			combo: {
				allowNull: true,
				type: DataTypes.INTEGER,
			},
			quantity: {
				allowNull: false,
				type: DataTypes.INTEGER,
				defaultValue: 1,
			},
			start_date: {
				allowNull: true,
				type: DataTypes.DATEONLY,
			},
			end_date: {
				allowNull: true,
				type: DataTypes.DATEONLY,
			},
			is_active: {
				allowNull: false,
				type: DataTypes.BOOLEAN,
				defaultValue: true,
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
			tableName: 'loyalty_rewards',
			appRawName: 'loyalty-rewards',
		};
	}

	static override relations(): RelationsReturn {
		return [
			{
				type: 'belongsTo',
				target: 'LoyaltyLevels',
				options: { foreignKey: 'required_loyalty_level', targetKey: 'id', as: '_LoyaltyLevels' },
			},
			{
				inversed: true,
				type: 'hasMany',
				target: 'LoyaltyLevels',
				options: { foreignKey: 'required_loyalty_level', targetKey: 'id', as: '_LoyaltyRewards' },
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
				options: { foreignKey: 'cinema', targetKey: 'id', as: '_LoyaltyRewards' },
			},
			{
				type: 'belongsTo',
				target: 'Products',
				options: { foreignKey: 'product', targetKey: 'id', as: '_Products' },
			},
			{
				inversed: true,
				type: 'hasMany',
				target: 'Products',
				options: { foreignKey: 'product', targetKey: 'id', as: '_LoyaltyRewards' },
			},
			{
				type: 'belongsTo',
				target: 'Combos',
				options: { foreignKey: 'combo', targetKey: 'id', as: '_Combos' },
			},
			{
				inversed: true,
				type: 'hasMany',
				target: 'Combos',
				options: { foreignKey: 'combo', targetKey: 'id', as: '_LoyaltyRewards' },
			},
		];
	}
}
