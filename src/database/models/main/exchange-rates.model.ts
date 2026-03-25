import { DataTypes } from 'sequelize';
import { type RelationsReturn, SequelizeModelBase } from '@database/models/bases/sequelize.model.js';

export default class ExchangeRatesModel extends SequelizeModelBase {
    static definition() {
        return {
            id: {
                primaryKey: true,
                allowNull: true,
                type: DataTypes.INTEGER,
                autoIncrement: true,
            },
            currency: {
                allowNull: false,
                type: DataTypes.INTEGER,
            },
            rate: {
                allowNull: false,
                type: DataTypes.DECIMAL(10, 2),
            },
            user: {
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
                defaultValue: 1
            },
        };
    }

    static config() {
        return {
            isBasicTable: false,
            schema: 'public',
            tableName: 'exchange_rates',
            appRawName: 'exchange_rates',
            timestamps: false,
        };
    }

    static override relations(): RelationsReturn {
        return [
            {
                type: 'belongsTo',
                target: 'Currencies',
                options: { foreignKey: 'currency', targetKey: 'id', as: '_Currency' },
            },
            {
                inversed: true,
                type: 'hasMany',
                target: 'Currencies',
                options: { foreignKey: 'currency', targetKey: 'id', as: '_ExchangeRates' },
            },
            {
                type: 'belongsTo',
                target: 'Users',
                options: { foreignKey: 'user', targetKey: 'id', as: '_User' },
            },
            {
                inversed: true,
                type: 'hasMany',
                target: 'Users',
                options: { foreignKey: 'user', targetKey: 'id', as: '_ExchangeRates' },
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
                options: { foreignKey: 'status', targetKey: 'id', as: '_ExchangeRates' },
            },
        ];
    }
}
