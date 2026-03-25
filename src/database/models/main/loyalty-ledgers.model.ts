import { DataTypes } from 'sequelize';
import { type RelationsReturn, SequelizeModelBase } from '@database/models/bases/sequelize.model.js';

export default class LoyaltyLedgersModel extends SequelizeModelBase {
    static definition() {
        return {
            id: {
                primaryKey: true,
                allowNull: true,
                type: DataTypes.INTEGER,
                autoIncrement: true,
            },
            customer: {
                allowNull: false,
                type: DataTypes.INTEGER,
            },
            order: {
                allowNull: true,
                type: DataTypes.INTEGER,
            },
            operation_type: {
                allowNull: false,
                type: DataTypes.INTEGER,
            },
            points: {
                allowNull: false,
                type: DataTypes.INTEGER,
            },
            created_at: {
                allowNull: false,
                type: DataTypes.DATE,
                defaultValue: DataTypes.NOW,
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
            tableName: 'loyalty_ledgers',
            appRawName: 'loyalty_ledgers',
            timestamps: false,
        };
    }

    static override relations(): RelationsReturn {
        return [
            { type: 'belongsTo', target: 'Customers', options: { foreignKey: 'customer', targetKey: 'id', as: '_Customer' } },
            { inversed: true, type: 'hasMany', target: 'Customers', options: { foreignKey: 'customer', targetKey: 'id', as: '_LoyaltyLedgers' } },
            { type: 'belongsTo', target: 'Orders', options: { foreignKey: 'order', targetKey: 'id', as: '_Order' } },
            { inversed: true, type: 'hasMany', target: 'Orders', options: { foreignKey: 'order', targetKey: 'id', as: '_LoyaltyLedgers' } },
            { type: 'belongsTo', target: 'OperationTypes', options: { foreignKey: 'operation_type', targetKey: 'id', as: '_OperationType' } },
            { inversed: true, type: 'hasMany', target: 'OperationTypes', options: { foreignKey: 'operation_type', targetKey: 'id', as: '_LoyaltyLedgers' } },
            { type: 'belongsTo', target: 'Statuses', options: { foreignKey: 'status', targetKey: 'id', as: '_Status' } },
            { inversed: true, type: 'hasMany', target: 'Statuses', options: { foreignKey: 'status', targetKey: 'id', as: '_LoyaltyLedgers' } },
        ];
    }
}
