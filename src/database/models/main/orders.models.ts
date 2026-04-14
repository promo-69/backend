import { DataTypes } from 'sequelize';
import { type RelationsReturn, SequelizeModelBase } from '@database/models/bases/sequelize.model.js';

export default class OrdersModel extends SequelizeModelBase {
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
            employee_position: {
                allowNull: true,
                type: DataTypes.INTEGER,
            },
            cinema: {
                allowNull: false,
                type: DataTypes.INTEGER,
            },
            order_status: {
                allowNull: false,
                type: DataTypes.INTEGER,
                defaultValue: 1,
            },
            base_currency: {
                allowNull: false,
                type: DataTypes.INTEGER,
            },
            total_amount_base_currency: {
                allowNull: false,
                type: DataTypes.DECIMAL(10, 2),
            },
            generated_points: {
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
                defaultValue: 1,
            },
        };
    }

    static config() {
        return {
            isBasicTable: false,
            schema: 'public',
            tableName: 'orders',
            appRawName: 'orders',
            timestamps: false,
        };
    }

    static override relations(): RelationsReturn {
        return [
            {
                type: 'belongsTo',
                target: 'Customers',
                options: { foreignKey: 'customer', targetKey: 'id', as: '_Customer' },
            },
            {
                inversed: true,
                type: 'hasMany',
                target: 'Customers',
                options: { foreignKey: 'customer', targetKey: 'id', as: '_Orders' },
            },
            {
                type: 'belongsTo',
                target: 'EmployeePositions',
                options: { foreignKey: 'employee_position', targetKey: 'id', as: '_EmployeePosition' },
            },
            {
                inversed: true,
                type: 'hasMany',
                target: 'EmployeePositions',
                options: { foreignKey: 'employee_position', targetKey: 'id', as: '_Orders' },
            },
            { type: 'belongsTo', target: 'Cinemas', options: { foreignKey: 'cinema', targetKey: 'id', as: '_Cinema' } },
            {
                inversed: true,
                type: 'hasMany',
                target: 'Cinemas',
                options: { foreignKey: 'cinema', targetKey: 'id', as: '_Orders' },
            },
            {
                type: 'belongsTo',
                target: 'OrderStatuses',
                options: { foreignKey: 'order_status', targetKey: 'id', as: '_OrderStatus' },
            },
            {
                inversed: true,
                type: 'hasMany',
                target: 'OrderStatuses',
                options: { foreignKey: 'order_status', targetKey: 'id', as: '_Orders' },
            },
            {
                type: 'belongsTo',
                target: 'Currencies',
                options: { foreignKey: 'base_currency', targetKey: 'id', as: '_BaseCurrency' },
            },
            {
                inversed: true,
                type: 'hasMany',
                target: 'Currencies',
                options: { foreignKey: 'base_currency', targetKey: 'id', as: '_Orders' },
            },
            {
                type: 'belongsTo',
                target: 'Statuses',
                options: { foreignKey: 'status', targetKey: 'id', as: '_Status' },
            },
            {
                inversed: true,
                type: 'hasMany',
                target: 'Statuses',
                options: { foreignKey: 'status', targetKey: 'id', as: '_Orders' },
            },
        ];
    }
}
