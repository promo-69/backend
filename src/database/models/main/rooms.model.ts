import { DataTypes } from 'sequelize';
import { type RelationsReturn, SequelizeModelBase } from '@database/models/bases/sequelize.model.js';

export default class RoomsModel extends SequelizeModelBase {
    static definition() {
        return {
            id: {
                primaryKey: true,
                allowNull: true,
                type: DataTypes.INTEGER,
                autoIncrement: true,
            },
            cinema: {
                allowNull: false,
                type: DataTypes.INTEGER,
            },
            name: {
                allowNull: false,
                type: DataTypes.STRING(100),
            },
            grid_rows: {
                allowNull: false,
                type: DataTypes.INTEGER,
            },
            grid_columns: {
                allowNull: false,
                type: DataTypes.INTEGER,
            },
            total_capacity: {
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
            tableName: 'rooms',
            appRawName: 'rooms',
            timestamps: false,
        };
    }

    static override relations(): RelationsReturn {
        return [
            {
                type: 'belongsTo',
                target: 'Cinemas',
                options: { foreignKey: 'cinema', targetKey: 'id', as: '_Cinema' },
            },
            {
                inversed: true,
                type: 'hasMany',
                target: 'Cinemas',
                options: { foreignKey: 'cinema', targetKey: 'id', as: '_Rooms' },
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
                options: { foreignKey: 'status', targetKey: 'id', as: '_Rooms' },
            },
        ];
    }
}
