import { DataTypes } from 'sequelize';
import { type RelationsReturn, SequelizeModelBase } from '@database/models/bases/sequelize.model.js';

export default class UserPermissionsModel extends SequelizeModelBase {
    static definition() {
        return {
            id: {
                primaryKey: true,
                allowNull: true,
                type: DataTypes.INTEGER,
                autoIncrement: true,
            },
            user: {
                allowNull: false,
                type: DataTypes.INTEGER,
            },
            permission: {
                allowNull: false,
                type: DataTypes.INTEGER,
            },
            is_granted: {
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
            isBasicTable: false,
            schema: 'public',
            tableName: 'user_permissions',
            appRawName: 'user_permissions',
            timestamps: false,
        };
    }

    static override relations(): RelationsReturn {
        return [
            {
                type: 'belongsTo',
                target: 'Users',
                options: { foreignKey: 'user', targetKey: 'id', as: '_User' },
            },
            {
                inversed: true,
                type: 'hasMany',
                target: 'Users',
                options: { foreignKey: 'user', targetKey: 'id', as: '_UserPermissions' },
            },
            {
                type: 'belongsTo',
                target: 'Permissions',
                options: { foreignKey: 'permission', targetKey: 'id', as: '_Permission' },
            },
            {
                inversed: true,
                type: 'hasMany',
                target: 'Permissions',
                options: { foreignKey: 'permission', targetKey: 'id', as: '_UserPermissions' },
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
                options: { foreignKey: 'status', targetKey: 'id', as: '_UserPermissions' },
            },
        ];
    }
}
