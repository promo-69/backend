import { DataTypes } from 'sequelize';
import { type RelationsReturn, SequelizeModelBase } from '@database/models/bases/sequelize.model.js';

export default class OrderLinesModel extends SequelizeModelBase {
    static definition() {
        return {
            id: {
                primaryKey: true,
                allowNull: true,
                type: DataTypes.INTEGER,
                autoIncrement: true,
            },
            order: {
                allowNull: false,
                type: DataTypes.INTEGER,
            },
            line_type: {
                allowNull: false,
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
            quantity: {
                allowNull: false,
                type: DataTypes.INTEGER,
            },
            original_unit_price: {
                allowNull: false,
                type: DataTypes.DECIMAL(10, 2),
            },
            price_modifier: {
                allowNull: true,
                type: DataTypes.INTEGER,
            },
            unit_price: {
                allowNull: false,
                type: DataTypes.DECIMAL(10, 2),
            },
            applied_exchange_rate: {
                allowNull: false,
                type: DataTypes.INTEGER,
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
            tableName: 'order_lines',
            appRawName: 'order_lines',
            timestamps: false,
        };
    }

    static override relations(): RelationsReturn {
        return [
            { type: 'belongsTo', target: 'Orders', options: { foreignKey: 'order', targetKey: 'id', as: '_Order' } },
            { inversed: true, type: 'hasMany', target: 'Orders', options: { foreignKey: 'order', targetKey: 'id', as: '_OrderLines' } },
            { type: 'belongsTo', target: 'LineTypes', options: { foreignKey: 'line_type', targetKey: 'id', as: '_LineType' } },
            { inversed: true, type: 'hasMany', target: 'LineTypes', options: { foreignKey: 'line_type', targetKey: 'id', as: '_OrderLines' } },
            { type: 'belongsTo', target: 'Products', options: { foreignKey: 'product', targetKey: 'id', as: '_Product' } },
            { inversed: true, type: 'hasMany', target: 'Products', options: { foreignKey: 'product', targetKey: 'id', as: '_OrderLines' } },
            { type: 'belongsTo', target: 'Combos', options: { foreignKey: 'combo', targetKey: 'id', as: '_Combo' } },
            { inversed: true, type: 'hasMany', target: 'Combos', options: { foreignKey: 'combo', targetKey: 'id', as: '_OrderLines' } },
            { type: 'belongsTo', target: 'PriceModifiers', options: { foreignKey: 'price_modifier', targetKey: 'id', as: '_PriceModifier' } },
            { inversed: true, type: 'hasMany', target: 'PriceModifiers', options: { foreignKey: 'price_modifier', targetKey: 'id', as: '_OrderLines' } },
            { type: 'belongsTo', target: 'ExchangeRates', options: { foreignKey: 'applied_exchange_rate', targetKey: 'id', as: '_AppliedExchangeRate' } },
            { inversed: true, type: 'hasMany', target: 'ExchangeRates', options: { foreignKey: 'applied_exchange_rate', targetKey: 'id', as: '_OrderLines' } },
            { type: 'belongsTo', target: 'Statuses', options: { foreignKey: 'status', targetKey: 'id', as: '_Status' } },
            { inversed: true, type: 'hasMany', target: 'Statuses', options: { foreignKey: 'status', targetKey: 'id', as: '_OrderLines' } },
        ];
    }
}
