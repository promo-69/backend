import { DataTypes } from 'sequelize';
import { type RelationsReturn, SequelizeModelBase } from '@database/models/bases/sequelize.model.js';

export default class PermissionActionsModel extends SequelizeModelBase {
    static override definition() {
        return {
            id: {
                primaryKey: true,
                allowNull: true,
                type: DataTypes.INTEGER,
                autoIncrement: true,
            },
            code: {
                allowNull: false,
                type: DataTypes.STRING(50),
            },
            description: {
                allowNull: true,
                type: DataTypes.STRING(200),
            },
            status: {
                allowNull: false,
                type: DataTypes.INTEGER,
                defaultValue: '1',
            },
        };
    }

    static override config() {
        return {
            isBasicTable: true,
            schema: 'public',
            tableName: 'permission_actions',
            appRawName: 'permission-actions',
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
                    as: '_PermissionActions',
                },
            },
        ];
    }
}
