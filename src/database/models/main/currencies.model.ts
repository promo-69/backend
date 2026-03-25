import { DataTypes } from 'sequelize';
import { type RelationsReturn, SequelizeModelBase } from '@database/models/bases/sequelize.model.js';

export default class CurrenciesModel extends SequelizeModelBase {
    static definition() {
        return {
            id: {
                primaryKey: true,
                allowNull: true,
                type: DataTypes.INTEGER,
                autoIncrement: true,
            },
            code: {
                allowNull: false,
                type: DataTypes.STRING(10),
            },
            description: {
                allowNull: false,
                type: DataTypes.STRING(255),
            },
            symbol: {
                allowNull: false,
                type: DataTypes.STRING(10),
            },
            is_base_currency: {
                allowNull: false,
                type: DataTypes.BOOLEAN,
            },
            status: {
                allowNull: false,
                type: DataTypes.INTEGER,
            },
        };
    }

    static config() {
        return {
            isBasicTable: true,
            schema: 'public',
            tableName: 'currencies',
            appRawName: 'currencies',
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
                options: { foreignKey: 'status', targetKey: 'id', as: '_Currencies' },
            },
        ];
    }
}
