import { DataTypes } from 'sequelize';
import { type RelationsReturn, SequelizeModelBase } from '@database/models/bases/sequelize.model.js';

export default class TaxRulesModel extends SequelizeModelBase {
	static definition() {
		return {
			id: {
				primaryKey: true,
				autoIncrement: true,
				allowNull: true,
				type: DataTypes.INTEGER,
			},
			tax: {
				allowNull: false,
				type: DataTypes.INTEGER,
			},
			tax_scope: {
				allowNull: false,
				type: DataTypes.INTEGER,
			},
			cinema: {
				allowNull: true,
				type: DataTypes.INTEGER,
			},
			line_type: {
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
			tableName: 'tax_rules',
			appRawName: 'tax_rules',
			timestamps: false,
		};
	}

	static override relations(): RelationsReturn {
		return [
			{
				type: 'belongsTo',
				target: 'Taxes',
				options: { foreignKey: 'tax', targetKey: 'id', as: '_Taxes' },
			},
			{
				inversed: true,
				type: 'hasMany',
				target: 'Taxes',
				options: { foreignKey: 'tax', targetKey: 'id', as: '_TaxRules' },
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
				options: { foreignKey: 'cinema', targetKey: 'id', as: '_TaxRules' },
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
				options: { foreignKey: 'line_type', targetKey: 'id', as: '_TaxRules' },
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
				options: { foreignKey: 'product_category', targetKey: 'id', as: '_TaxRules' },
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
				options: { foreignKey: 'product', targetKey: 'id', as: '_TaxRules' },
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
				options: { foreignKey: 'combo', targetKey: 'id', as: '_TaxRules' },
			},
		];
	}
}
