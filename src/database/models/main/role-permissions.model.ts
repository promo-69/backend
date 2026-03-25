import { DataTypes } from 'sequelize';
import { type RelationsReturn, SequelizeModelBase } from '@database/models/bases/sequelize.model.js';

export default class RolePermissionsModel extends SequelizeModelBase {
    static definition() {
        return {
            id: {
                primaryKey: true,
                allowNull: true,
                type: DataTypes.INTEGER,
                autoIncrement: true,
            },
            role: {
                allowNull: false,
                type: DataTypes.INTEGER,
            },
            permission: {
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
            tableName: 'role_permissions',
            appRawName: 'role_permissions',
            timestamps: false,
        };
    }

    static override relations(): RelationsReturn {
        return [
            {
                type: 'belongsTo',
                target: 'Roles',
                options: { foreignKey: 'role', targetKey: 'id', as: '_Role' },
            },
            {
                inversed: true,
                type: 'hasMany',
                target: 'Roles',
                options: { foreignKey: 'role', targetKey: 'id', as: '_RolePermissions' },
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
                options: { foreignKey: 'permission', targetKey: 'id', as: '_RolePermissions' },
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
                options: { foreignKey: 'status', targetKey: 'id', as: '_RolePermissions' },
            },
        ];
    }
}
