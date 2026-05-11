import { DataTypes } from 'sequelize';
import { type RelationsReturn, SequelizeModelBase } from '@database/models/bases/sequelize.model.js';

export default class PriceModifiersModel extends SequelizeModelBase {
	static definition() {
		return {
			id: {
				primaryKey: true,
				autoIncrement: true,
				allowNull: true,
				type: DataTypes.INTEGER,
			},
			description: {
				allowNull: false,
				type: DataTypes.STRING(255),
			},
			operation_type: {
				allowNull: false,
				type: DataTypes.INTEGER,
			},
			is_percentage: {
				allowNull: false,
				type: DataTypes.BOOLEAN,
			},
			value: {
				allowNull: false,
				type: DataTypes.DECIMAL(10, 2),
			},
			currency: {
				allowNull: true,
				type: DataTypes.INTEGER,
			},
			modifier_scope: {
				allowNull: false,
				type: DataTypes.INTEGER,
			},
			audience_category: {
				allowNull: true,
				type: DataTypes.INTEGER,
			},
			week_day: {
				allowNull: true,
				type: DataTypes.INTEGER,
			},
			seat_category: {
				allowNull: true,
				type: DataTypes.INTEGER,
			},
			projection_type: {
				allowNull: true,
				type: DataTypes.INTEGER,
			},
			product_category: {
				allowNull: true,
				type: DataTypes.INTEGER,
			},
			product: {
				allowNull: true,
				type: DataTypes.INTEGER,
			},
			combo: {
				allowNull: true,
				type: DataTypes.INTEGER,
			},
			cinema: {
				allowNull: true,
				type: DataTypes.INTEGER,
			},
			start_date: {
				allowNull: true,
				type: DataTypes.DATEONLY,
			},
			end_date: {
				allowNull: true,
				type: DataTypes.DATEONLY,
			},
			start_time: {
				allowNull: true,
				type: DataTypes.TIME,
			},
			end_time: {
				allowNull: true,
				type: DataTypes.TIME,
			},
			line_type: {
				allowNull: true,
				type: DataTypes.INTEGER,
			},
			target_currency: {
				allowNull: true,
				type: DataTypes.INTEGER,
			},
			target_currency_condition: {
				allowNull: true,
				type: DataTypes.BOOLEAN,
				defaultValue: false,
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
			tableName: 'price_modifiers',
			appRawName: 'price_modifiers',
		};
	}

	static override relations(): RelationsReturn {
		return [
			{
				type: 'belongsTo',
				target: 'ModifierScopes',
				options: { foreignKey: 'modifier_scope', targetKey: 'id', as: '_ModifierScopes' },
			},
			{
				inversed: true,
				type: 'hasMany',
				target: 'ModifierScopes',
				options: { foreignKey: 'modifier_scope', targetKey: 'id', as: '_PriceModifiers' },
			},
			{
				type: 'belongsTo',
				target: 'AudienceCategories',
				options: { foreignKey: 'audience_category', targetKey: 'id', as: '_AudienceCategories' },
			},
			{
				inversed: true,
				type: 'hasMany',
				target: 'AudienceCategories',
				options: { foreignKey: 'audience_category', targetKey: 'id', as: '_PriceModifiers' },
			},
			{
				type: 'belongsTo',
				target: 'WeekDays',
				options: { foreignKey: 'week_day', targetKey: 'id', as: '_WeekDays' },
			},
			{
				inversed: true,
				type: 'hasMany',
				target: 'WeekDays',
				options: { foreignKey: 'week_day', targetKey: 'id', as: '_PriceModifiers' },
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
				options: { foreignKey: 'seat_category', targetKey: 'id', as: '_PriceModifiers' },
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
				options: { foreignKey: 'projection_type', targetKey: 'id', as: '_PriceModifiers' },
			},
			{
				type: 'belongsTo',
				target: 'ProductCategories',
				options: { foreignKey: 'product_category', targetKey: 'id', as: '_ProductCategories' },
			},
			{
				inversed: true,
				type: 'hasMany',
				target: 'ProductCategories',
				options: { foreignKey: 'product_category', targetKey: 'id', as: '_PriceModifiers' },
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
				options: { foreignKey: 'product', targetKey: 'id', as: '_PriceModifiers' },
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
				options: { foreignKey: 'combo', targetKey: 'id', as: '_PriceModifiers' },
			},
			{
				type: 'belongsTo',
				target: 'OperationTypes',
				options: { foreignKey: 'operation_type', targetKey: 'id', as: '_OperationTypes' },
			},
			{
				inversed: true,
				type: 'hasMany',
				target: 'OperationTypes',
				options: { foreignKey: 'operation_type', targetKey: 'id', as: '_PriceModifiers' },
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
				options: { foreignKey: 'cinema', targetKey: 'id', as: '_PriceModifiers' },
			},
			{
				type: 'belongsTo',
				target: 'LineTypes',
				options: { foreignKey: 'line_type', targetKey: 'id', as: '_LineTypes' },
			},
			{
				inversed: true,
				type: 'hasMany',
				target: 'LineTypes',
				options: { foreignKey: 'line_type', targetKey: 'id', as: '_PriceModifiers' },
			},
			{
				type: 'belongsTo',
				target: 'Currencies',
				options: { foreignKey: 'currency', targetKey: 'id', as: '_Currency' },
			},
			{
				inversed: true,
				type: 'hasMany',
				target: 'Currencies',
				options: { foreignKey: 'currency', targetKey: 'id', as: '_PriceModifiersCurrency' },
			},
			{
				type: 'belongsTo',
				target: 'Currencies',
				options: { foreignKey: 'target_currency', targetKey: 'id', as: '_TargetCurrency' },
			},
			{
				inversed: true,
				type: 'hasMany',
				target: 'Currencies',
				options: { foreignKey: 'target_currency', targetKey: 'id', as: '_PriceModifiersCurrencyTarget' },
			},
		];
	}
}
