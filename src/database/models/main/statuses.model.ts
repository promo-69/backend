import { DataTypes } from 'sequelize';
import { type RelationsReturn, SequelizeModelBase } from '@database/models/bases/sequelize.model.js';

export default class StatusesModel extends SequelizeModelBase {
    static definition() {
        return {
            id: {
                primaryKey: true,
                allowNull: true,
                type: DataTypes.INTEGER,
                autoIncrement: true,
            },
            description: {
                allowNull: false,
                type: DataTypes.STRING(255),
            },
        };
    }

    static config() {
        return {
            isBasicTable: true,
            schema: 'public',
            tableName: 'statuses',
            appRawName: 'statuses',
            timestamps: false,
        };
    }

    static override relations(): RelationsReturn {
        return [];
    }
}
