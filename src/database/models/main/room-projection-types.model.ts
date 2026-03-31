import { DataTypes } from 'sequelize';
import { type RelationsReturn, SequelizeModelBase } from '@database/models/bases/sequelize.model.js';

export default class RoomProjectionTypesModel extends SequelizeModelBase {
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
            projection_type: {
                allowNull: false,
                type: DataTypes.INTEGER,
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
            tableName: 'room_projection_types',
            appRawName: 'room_projection_types',
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
                options: { foreignKey: 'room', targetKey: 'id', as: '_RoomProjectionTypes' },
            },
            {
                type: 'belongsTo',
                target: 'ProjectionTypes',
                options: { foreignKey: 'projection_type', targetKey: 'id', as: '_ProjectionType' },
            },
            {
                inversed: true,
                type: 'hasMany',
                target: 'ProjectionTypes',
                options: { foreignKey: 'projection_type', targetKey: 'id', as: '_RoomProjectionTypes' },
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
                options: { foreignKey: 'status', targetKey: 'id', as: '_RoomProjectionTypes' },
            },
        ];
    }
}
