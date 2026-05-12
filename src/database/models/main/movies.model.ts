import { DataTypes } from 'sequelize';
import { type RelationsReturn, SequelizeModelBase } from '@database/models/bases/sequelize.model.js';

export default class MoviesModel extends SequelizeModelBase {
    static definition() {
        return {
            id: {
                primaryKey: true,
                allowNull: true,
                type: DataTypes.INTEGER,
                autoIncrement: true,
            },
            title: {
                allowNull: false,
                type: DataTypes.STRING(255),
            },
            duration_minutes: {
                allowNull: false,
                type: DataTypes.INTEGER,
            },
            age_classification: {
                allowNull: false,
                type: DataTypes.INTEGER,
            },
            lifecycle_state: {
                allowNull: false,
                type: DataTypes.INTEGER,
            },
            synopsis: {
                allowNull: false,
                type: DataTypes.TEXT,
            },
            poster_url: {
                allowNull: true,
                type: DataTypes.STRING(500),
            },
            banner_url: {
                allowNull: true,
                type: DataTypes.STRING(500),
            },
            trailer_url: {
                allowNull: true,
                type: DataTypes.STRING(500),
            },
            release_date: {
                allowNull: false,
                type: DataTypes.DATEONLY,
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
            tableName: 'movies',
            appRawName: 'movies',
            timestamps: false,
        };
    }

    static override relations(): RelationsReturn {
        return [
            {
                type: 'belongsTo',
                target: 'AgeClassifications',
                options: { foreignKey: 'age_classification', targetKey: 'id', as: '_AgeClassification' },
            },
            {
                inversed: true,
                type: 'hasMany',
                target: 'AgeClassifications',
                options: { foreignKey: 'age_classification', targetKey: 'id', as: '_Movies' },
            },
            {
                type: 'belongsTo',
                target: 'MovieLifecycleStates',
                options: { foreignKey: 'lifecycle_state', targetKey: 'id', as: '_LifecycleState' },
            },
            {
                inversed: true,
                type: 'hasMany',
                target: 'MovieLifecycleStates',
                options: { foreignKey: 'lifecycle_state', targetKey: 'id', as: '_Movies' },
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
                options: { foreignKey: 'status', targetKey: 'id', as: '_Movies' },
            },
        ];
    }
}
