import { DataTypes } from 'sequelize';
import { type RelationsReturn, SequelizeModelBase } from '@database/models/bases/sequelize.model.js';

export default class EmployeePositionsModel extends SequelizeModelBase {
    static definition() {
        return {
            id: {
                primaryKey: true,
                allowNull: true,
                type: DataTypes.INTEGER,
                autoIncrement: true,
            },
            employee: {
                allowNull: false,
                type: DataTypes.INTEGER,
            },
            job_position: {
                allowNull: false,
                type: DataTypes.INTEGER,
            },
            cinema: {
                allowNull: false,
                type: DataTypes.INTEGER,
            },
            start_date: {
                allowNull: false,
                type: DataTypes.DATEONLY,
            },
            end_date: {
                allowNull: true,
                type: DataTypes.DATEONLY,
            },
            salary_base: {
                allowNull: true,
                type: DataTypes.DECIMAL(10, 2),
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
            tableName: 'employee_positions',
            appRawName: 'employee_positions',
            timestamps: false,
        };
    }

    static override relations(): RelationsReturn {
        return [
            {
                type: 'belongsTo',
                target: 'Employees',
                options: { foreignKey: 'employee', targetKey: 'id', as: '_Employee' },
            },
            {
                inversed: true,
                type: 'hasMany',
                target: 'Employees',
                options: { foreignKey: 'employee', targetKey: 'id', as: '_Positions' },
            },
            {
                type: 'belongsTo',
                target: 'JobPositions',
                options: { foreignKey: 'job_position', targetKey: 'id', as: '_JobPosition' },
            },
            {
                inversed: true,
                type: 'hasMany',
                target: 'JobPositions',
                options: { foreignKey: 'job_position', targetKey: 'id', as: '_EmployeeAssignments' },
            },
            { type: 'belongsTo', target: 'Cinemas', options: { foreignKey: 'cinema', targetKey: 'id', as: '_Cinema' } },
            {
                inversed: true,
                type: 'hasMany',
                target: 'Cinemas',
                options: { foreignKey: 'cinema', targetKey: 'id', as: '_StaffPositions' },
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
                options: { foreignKey: 'status', targetKey: 'id', as: '_EmployeePositions' },
            },
        ];
    }
}
