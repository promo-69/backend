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
            {
                type: 'belongsTo',
                target: 'People',
                options: { foreignKey: 'person', targetKey: 'id', as: '_People' },
            },
            {
                inversed: true,
                type: 'hasOne',
                target: 'People',
                options: { foreignKey: 'person', targetKey: 'id', as: '_Customer' },
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
