import { DataTypes } from 'sequelize';
import { type RelationsReturn, SequelizeModelBase } from '@database/models/bases/sequelize.model.js';

export default class CustomersModel extends SequelizeModelBase {
    static definition() {
        return {
            id: {
                primaryKey: true,
                allowNull: true,
                type: DataTypes.INTEGER,
                autoIncrement: true,
            },
            person: {
                allowNull: false,
                type: DataTypes.INTEGER,
            },
            loyalty_level: {
                allowNull: false,
                type: DataTypes.INTEGER,
                defaultValue: 1,
            },
            level_progress_points: {
                allowNull: false,
                type: DataTypes.INTEGER,
                defaultValue: 0,
            },
            registration_date: {
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
            tableName: 'customers',
            appRawName: 'customers',
            timestamps: false,
        };
    }

    static override relations(): RelationsReturn {
        return [
            { type: 'belongsTo', target: 'People', options: { foreignKey: 'person', targetKey: 'id', as: '_People' } },
            {
                inversed: true,
                type: 'hasOne',
                target: 'People',
                options: { foreignKey: 'person', targetKey: 'id', as: '_Customer' },
            },
            {
                type: 'belongsTo',
                target: 'LoyaltyLevels',
                options: { foreignKey: 'loyalty_level', targetKey: 'id', as: '_LoyaltyLevel' },
            },
            {
                inversed: true,
                type: 'hasMany',
                target: 'LoyaltyLevels',
                options: { foreignKey: 'loyalty_level', targetKey: 'id', as: '_Customers' },
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
                options: { foreignKey: 'status', targetKey: 'id', as: '_Customers' },
            },
        ];
    }
}
