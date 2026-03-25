import { DataTypes } from 'sequelize';
import { type RelationsReturn, SequelizeModelBase } from '@database/models/bases/sequelize.model.js';

export default class ShowtimesModel extends SequelizeModelBase {
    static definition() {
        return {
            id: {
                primaryKey: true,
                allowNull: true,
                type: DataTypes.INTEGER,
                autoIncrement: true,
            },
            movie: {
                allowNull: false,
                type: DataTypes.INTEGER,
            },
            room: {
                allowNull: false,
                type: DataTypes.INTEGER,
            },
            projection_type: {
                allowNull: false,
                type: DataTypes.INTEGER,
            },
            start_time: {
                allowNull: false,
                type: DataTypes.DATE,
            },
            end_time: {
                allowNull: false,
                type: DataTypes.DATE,
            },
            currency: {
                allowNull: false,
                type: DataTypes.INTEGER,
            },
            price: {
                allowNull: false,
                type: DataTypes.DECIMAL(10, 2),
            },
            earned_loyalty_points: {
                allowNull: true,
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
            tableName: 'showtimes',
            appRawName: 'showtimes',
            timestamps: false,
        };
    }

    static override relations(): RelationsReturn {
        return [
            {
                type: 'belongsTo',
                target: 'Movies',
                options: { foreignKey: 'movie', targetKey: 'id', as: '_Movie' },
            },
            {
                inversed: true,
                type: 'hasMany',
                target: 'Movies',
                options: { foreignKey: 'movie', targetKey: 'id', as: '_Showtimes' },
            },
            {
                type: 'belongsTo',
                target: 'Rooms',
                options: { foreignKey: 'room', targetKey: 'id', as: '_Room' },
            },
            {
                inversed: true,
                type: 'hasMany',
                target: 'Rooms',
                options: { foreignKey: 'room', targetKey: 'id', as: '_Showtimes' },
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
                options: { foreignKey: 'projection_type', targetKey: 'id', as: '_Showtimes' },
            },
            {
                type: 'belongsTo',
                target: 'Currencies',
                options: { foreignKey: 'currency', targetKey: 'id', as: '_Currency' },
            },
            {
                inversed: true,
                type: 'hasMany',
                target: 'Currencies',
                options: { foreignKey: 'currency', targetKey: 'id', as: '_Showtimes' },
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
                options: { foreignKey: 'status', targetKey: 'id', as: '_Showtimes' },
            },
        ];
    }
}
