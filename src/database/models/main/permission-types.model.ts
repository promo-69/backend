import { DataTypes } from 'sequelize';
import { type RelationsReturn, SequelizeModelBase } from '@database/models/bases/sequelize.model.js';

export default class PermissionTypesModel extends SequelizeModelBase {
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
                type: DataTypes.STRING(100),
            },
            description: {
                allowNull: false,
                type: DataTypes.STRING(255),
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
            tableName: 'permission_types',
            appRawName: 'permission_types',
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
                options: { foreignKey: 'status', targetKey: 'id', as: '_PermissionTypes' },
            },
        ];
    }
}
