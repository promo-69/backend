import { DataTypes } from 'sequelize';
import { type RelationsReturn, SequelizeModelBase } from '@database/models/bases/sequelize.model.js';

export default class PriceModifiersModel extends SequelizeModelBase {
    static definition() {
        return {
            id: {
                primaryKey: true,
                allowNull: true,
                type: DataTypes.INTEGER,
                autoIncrement: true,
            },
            description: {
                allowNull: false,
                type: DataTypes.STRING(255),
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
            status: {
                allowNull: false,
                type: DataTypes.INTEGER,
                defaultValue: 1
            },
        };
    }

    static config() {
        return {
            isBasicTable: false,
            schema: 'public',
            tableName: 'price_modifiers',
            appRawName: 'price_modifiers',
            timestamps: false,
        };
    }

    static override relations(): RelationsReturn {
        return [
            { type: 'belongsTo', target: 'ModifierScopes', options: { foreignKey: 'modifier_scope', targetKey: 'id', as: '_ModifierScope' } },
            { inversed: true, type: 'hasMany', target: 'ModifierScopes', options: { foreignKey: 'modifier_scope', targetKey: 'id', as: '_PriceModifiers' } },
            { type: 'belongsTo', target: 'AudienceCategories', options: { foreignKey: 'audience_category', targetKey: 'id', as: '_AudienceCategory' } },
            { inversed: true, type: 'hasMany', target: 'AudienceCategories', options: { foreignKey: 'audience_category', targetKey: 'id', as: '_PriceModifiers' } },
            { type: 'belongsTo', target: 'WeekDays', options: { foreignKey: 'week_day', targetKey: 'id', as: '_WeekDay' } },
            { inversed: true, type: 'hasMany', target: 'WeekDays', options: { foreignKey: 'week_day', targetKey: 'id', as: '_PriceModifiers' } },
            { type: 'belongsTo', target: 'SeatCategories', options: { foreignKey: 'seat_category', targetKey: 'id', as: '_SeatCategory' } },
            { inversed: true, type: 'hasMany', target: 'SeatCategories', options: { foreignKey: 'seat_category', targetKey: 'id', as: '_PriceModifiers' } },
            { type: 'belongsTo', target: 'ProjectionTypes', options: { foreignKey: 'projection_type', targetKey: 'id', as: '_ProjectionType' } },
            { inversed: true, type: 'hasMany', target: 'ProjectionTypes', options: { foreignKey: 'projection_type', targetKey: 'id', as: '_PriceModifiers' } },
            { type: 'belongsTo', target: 'ProductCategories', options: { foreignKey: 'product_category', targetKey: 'id', as: '_ProductCategory' } },
            { inversed: true, type: 'hasMany', target: 'ProductCategories', options: { foreignKey: 'product_category', targetKey: 'id', as: '_PriceModifiers' } },
            { type: 'belongsTo', target: 'Products', options: { foreignKey: 'product', targetKey: 'id', as: '_Product' } },
            { inversed: true, type: 'hasMany', target: 'Products', options: { foreignKey: 'product', targetKey: 'id', as: '_PriceModifiers' } },
            { type: 'belongsTo', target: 'Combos', options: { foreignKey: 'combo', targetKey: 'id', as: '_Combo' } },
            { inversed: true, type: 'hasMany', target: 'Combos', options: { foreignKey: 'combo', targetKey: 'id', as: '_PriceModifiers' } },
            { type: 'belongsTo', target: 'OperationTypes', options: { foreignKey: 'operation_type', targetKey: 'id', as: '_OperationType' } },
            { inversed: true, type: 'hasMany', target: 'OperationTypes', options: { foreignKey: 'operation_type', targetKey: 'id', as: '_PriceModifiers' } },
            { type: 'belongsTo', target: 'Statuses', options: { foreignKey: 'status', targetKey: 'id', as: '_Status' } },
            { inversed: true, type: 'hasMany', target: 'Statuses', options: { foreignKey: 'status', targetKey: 'id', as: '_PriceModifiers' } },
        ];
    }
}
