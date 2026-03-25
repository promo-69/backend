import { DataTypes } from 'sequelize';
import { type RelationsReturn, SequelizeModelBase } from '@database/models/bases/sequelize.model.js';

export default class SeatsModel extends SequelizeModelBase {
    static definition() {
        return {
            id: {
                primaryKey: true,
                allowNull: true,
                type: DataTypes.INTEGER,
                autoIncrement: true,
            },
            room: {
                allowNull: false,
                type: DataTypes.INTEGER,
            },
            row_identifier: {
                allowNull: false,
                type: DataTypes.STRING(2),
            },
            column_number: {
                allowNull: false,
                type: DataTypes.INTEGER,
            },
            seat_category: {
                allowNull: false,
                type: DataTypes.INTEGER,
            },
            seat_condition: {
                allowNull: false,
                type: DataTypes.INTEGER,
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
            tableName: 'seats',
            appRawName: 'seats',
            timestamps: false,
        };
    }

    static override relations(): RelationsReturn {
        return [
            {
                type: 'belongsTo',
                target: 'Rooms',
                options: { foreignKey: 'room', targetKey: 'id', as: '_Room' },
            },
            {
                inversed: true,
                type: 'hasMany',
                target: 'Rooms',
                options: { foreignKey: 'room', targetKey: 'id', as: '_Seats' },
            },
            {
                type: 'belongsTo',
                target: 'SeatCategories',
                options: { foreignKey: 'seat_category', targetKey: 'id', as: '_SeatCategory' },
            },
            {
                inversed: true,
                type: 'hasMany',
                target: 'SeatCategories',
                options: { foreignKey: 'seat_category', targetKey: 'id', as: '_Seats' },
            },
            {
                type: 'belongsTo',
                target: 'SeatConditions',
                options: { foreignKey: 'seat_condition', targetKey: 'id', as: '_SeatCondition' },
            },
            {
                inversed: true,
                type: 'hasMany',
                target: 'SeatConditions',
                options: { foreignKey: 'seat_condition', targetKey: 'id', as: '_Seats' },
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
                options: { foreignKey: 'status', targetKey: 'id', as: '_Seats' },
            },
        ];
    }
}
