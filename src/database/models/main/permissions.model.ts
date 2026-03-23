import { DataTypes } from 'sequelize';
import { type RelationsReturn, SequelizeModelBase } from '@database/models/bases/sequelize.model.js';

export default class PermissionsModel extends SequelizeModelBase {
    static definition() {
        return {
            id: {
                primaryKey: true,
                allowNull: true,
                type: DataTypes.INTEGER,
                autoIncrement: true,
            },
            resource: {
                allowNull: false,
                type: DataTypes.INTEGER,
            },
            action: {
                allowNull: false,
                type: DataTypes.INTEGER,
            },
            permissionType: {
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
            isBasicTable: true,
            schema: 'public',
            tableName: 'permissions',
            appRawName: 'permissions',
        };
    }

    static override relations(): RelationsReturn {
        return [
            {
                type: 'belongsTo',
                target: 'PermissionResources',
                options: {
                    foreignKey: 'resource',
                    targetKey: 'id',
                    as: '_Resources',
                },
            },
            {
                inversed: true,
                type: 'hasMany',
                target: 'PermissionResources',
                options: {
                    foreignKey: 'resource',
                    targetKey: 'id',
                    as: '_Permissions',
                },
            },
            {
                type: 'belongsTo',
                target: 'PermissionActions',
                options: {
                    foreignKey: 'action',
                    targetKey: 'id',
                    as: '_Actions',
                },
            },
            {
                inversed: true,
                type: 'hasMany',
                target: 'PermissionActions',
                options: {
                    foreignKey: 'action',
                    targetKey: 'id',
                    as: '_Permissions',
                },
            },
            {
                type: 'belongsTo',
                target: 'PermissionTypes',
                options: {
                    foreignKey: 'permissionType',
                    targetKey: 'id',
                    as: '_PermissionTypes',
                },
            },
            {
                inversed: true,
                type: 'hasMany',
                target: 'PermissionTypes',
                options: {
                    foreignKey: 'permissionType',
                    targetKey: 'id',
                    as: '_Permissions',
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
                    as: '_Permissions',
                },
            },
        ];
    }
}
