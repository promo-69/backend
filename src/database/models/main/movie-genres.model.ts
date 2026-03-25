import { DataTypes } from 'sequelize';
import { type RelationsReturn, SequelizeModelBase } from '@database/models/bases/sequelize.model.js';

export default class MovieGenresModel extends SequelizeModelBase {
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
            genre: {
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
            tableName: 'movie_genres',
            appRawName: 'movie_genres',
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
                options: { foreignKey: 'movie', targetKey: 'id', as: '_MovieGenres' },
            },
            {
                type: 'belongsTo',
                target: 'Genres',
                options: { foreignKey: 'genre', targetKey: 'id', as: '_Genre' },
            },
            {
                inversed: true,
                type: 'hasMany',
                target: 'Genres',
                options: { foreignKey: 'genre', targetKey: 'id', as: '_MovieGenres' },
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
                options: { foreignKey: 'status', targetKey: 'id', as: '_MovieGenres' },
            },
        ];
    }
}
