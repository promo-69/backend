import { DataTypes } from 'sequelize';
import { type RelationsReturn, SequelizeModelBase } from '@database/models/bases/sequelize.model.js';

export default class OrderPaymentsModel extends SequelizeModelBase {
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
            payment_method: {
                allowNull: false,
                type: DataTypes.INTEGER,
            },
            amount: {
                allowNull: false,
                type: DataTypes.DECIMAL(10, 2),
            },
            applied_exchange_rate: {
                allowNull: false,
                type: DataTypes.INTEGER,
            },
            reference_number: {
                allowNull: true,
                type: DataTypes.STRING(255),
            },
            is_approved: {
                allowNull: false,
                type: DataTypes.BOOLEAN,
            },
            status: {
                allowNull: false,
                type: DataTypes.INTEGER,
            },
        };
    }

    static config() {
        return {
            isBasicTable: false,
            schema: 'public',
            tableName: 'order_payments',
            appRawName: 'order_payments',
            timestamps: false,
        };
    }

    static override relations(): RelationsReturn {
        return [
            { type: 'belongsTo', target: 'Orders', options: { foreignKey: 'order', targetKey: 'id', as: '_Order' } },
            { inversed: true, type: 'hasMany', target: 'Orders', options: { foreignKey: 'order', targetKey: 'id', as: '_OrderPayments' } },
            { type: 'belongsTo', target: 'PaymentMethods', options: { foreignKey: 'payment_method', targetKey: 'id', as: '_PaymentMethod' } },
            { inversed: true, type: 'hasMany', target: 'PaymentMethods', options: { foreignKey: 'payment_method', targetKey: 'id', as: '_OrderPayments' } },
            { type: 'belongsTo', target: 'ExchangeRates', options: { foreignKey: 'applied_exchange_rate', targetKey: 'id', as: '_AppliedExchangeRate' } },
            { inversed: true, type: 'hasMany', target: 'ExchangeRates', options: { foreignKey: 'applied_exchange_rate', targetKey: 'id', as: '_OrderPayments' } },
            { type: 'belongsTo', target: 'Statuses', options: { foreignKey: 'status', targetKey: 'id', as: '_Status' } },
            { inversed: true, type: 'hasMany', target: 'Statuses', options: { foreignKey: 'status', targetKey: 'id', as: '_OrderPayments' } },
        ];
    }
}
