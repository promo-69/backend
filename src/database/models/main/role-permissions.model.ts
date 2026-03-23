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
            roleId: {
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
                defaultValue: '1',
            },
        };
    }

    static config() {
        return {
            schema: 'public',
            tableName: 'role_permissions',
            appRawName: 'role-permissions',
        };
    }

    static override relations(): RelationsReturn {
        return [
            {
                type: 'belongsTo',
                target: 'SystemRoles',
                options: {
                    foreignKey: 'roleId',
                    targetKey: 'id',
                    as: '_Roles',
                },
            },
            {
                inversed: true,
                type: 'hasMany',
                target: 'SystemRoles',
                options: {
                    foreignKey: 'roleId',
                    targetKey: 'id',
                    as: '_RolePermissions',
                },
            },
            {
                type: 'belongsTo',
                target: 'Permissions',
                options: {
                    foreignKey: 'permission',
                    targetKey: 'id',
                    as: '_Permissions',
                },
            },
            {
                inversed: true,
                type: 'hasMany',
                target: 'Permissions',
                options: {
                    foreignKey: 'permission',
                    targetKey: 'id',
                    as: '_RolePermissions',
                },
            },
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
                    as: '_RolePermissions',
                },
            },
        ];
    }
}
