import { DataTypes } from 'sequelize';
import { type RelationsReturn, SequelizeModelBase } from '@database/models/bases/sequelize.model.js';

export default class EmployeesModel extends SequelizeModelBase {
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
            cinema: {
                allowNull: false,
                type: DataTypes.INTEGER,
            },
            hire_date: {
                allowNull: false,
                type: DataTypes.DATEONLY,
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
            tableName: 'employees',
            appRawName: 'employees',
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
                options: { foreignKey: 'person', targetKey: 'id', as: '_Employee' },
            },
            {
                type: 'belongsTo',
                target: 'Cinemas',
                options: { foreignKey: 'cinema', targetKey: 'id', as: '_Cinema' },
            },
            {
                inversed: true,
                type: 'hasMany',
                target: 'Cinemas',
                options: { foreignKey: 'cinema', targetKey: 'id', as: '_Employees' },
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
                options: { foreignKey: 'status', targetKey: 'id', as: '_Employees' },
            },
        ];
    }
}
