import { DataTypes } from 'sequelize';
import { type RelationsReturn, SequelizeModelBase } from '@database/models/bases/sequelize.model.js';
import { abbreviate } from '@utils/string-formatters.util.js';

export default class GendersModel extends SequelizeModelBase {
    static definition() {
        return {
            id: {
                primaryKey: true,
                allowNull: true,
                type: DataTypes.INTEGER,
                autoIncrement: true,
            },
            abbreviation: {
                allowNull: false,
                type: DataTypes.STRING(1),
            },
            description: {
                allowNull: false,
                type: DataTypes.STRING(50),
            },
            status: {
                allowNull: false,
                type: DataTypes.INTEGER,
                defaultValue: '1',
            },
        };
    }

    static config() {
        return {
            isBasicTable: true,
            schema: 'public',
            tableName: 'genders',
            appRawName: 'genders',
        };
    }

    static override relations(): RelationsReturn {
        return [
            {
                type: 'belongsTo',
                target: 'Status',
                options: {
                    foreignKey: 'status',
                    targetKey: 'id',
                    as: '_Status',
                },
            },
            {
                inversed: true,
                type: 'hasMany',
                target: 'Status',
                options: {
                    foreignKey: 'status',
                    targetKey: 'id',
                    as: '_Genders',
                },
            },
        ];
    }
}
