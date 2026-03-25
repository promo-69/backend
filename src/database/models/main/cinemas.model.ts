import { DataTypes } from 'sequelize';
import { type RelationsReturn, SequelizeModelBase } from '@database/models/bases/sequelize.model.js';

export default class CinemasModel extends SequelizeModelBase {
    static definition() {
        return {
            id: {
                primaryKey: true,
                allowNull: true,
                type: DataTypes.INTEGER,
                autoIncrement: true,
            },
            name: {
                allowNull: false,
                type: DataTypes.STRING(255),
            },
            address: {
                allowNull: true,
                type: DataTypes.TEXT,
            },
            phone: {
                allowNull: true,
                type: DataTypes.STRING(50),
            },
            opening_time: {
                allowNull: false,
                type: DataTypes.TIME,
            },
            closing_time: {
                allowNull: false,
                type: DataTypes.TIME,
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
            tableName: 'cinemas',
            appRawName: 'cinemas',
            timestamps: false,
        };
    }

    static override relations(): RelationsReturn {
        return [
            {
                type: 'belongsTo',
                target: 'Statuses',
                options: { foreignKey: 'status', targetKey: 'id', as: '_Status' },
            },
            {
                inversed: true,
                type: 'hasMany',
                target: 'Statuses',
                options: { foreignKey: 'status', targetKey: 'id', as: '_Cinemas' },
            },
        ];
    }
}
