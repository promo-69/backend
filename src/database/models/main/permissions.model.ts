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
            action: {
                allowNull: false,
                type: DataTypes.INTEGER,
            },
            resource: {
                allowNull: false,
                type: DataTypes.INTEGER,
            },
            permission_type: {
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
            tableName: 'permissions',
            appRawName: 'permissions',
            timestamps: false,
        };
    }

    static override relations(): RelationsReturn {
        return [
            {
                type: 'belongsTo',
                target: 'Actions',
                options: { foreignKey: 'action', targetKey: 'id', as: '_Action' },
            },
            {
                inversed: true,
                type: 'hasMany',
                target: 'Actions',
                options: { foreignKey: 'action', targetKey: 'id', as: '_Permissions' },
            },
            {
                type: 'belongsTo',
                target: 'Resources',
                options: { foreignKey: 'resource', targetKey: 'id', as: '_Resource' },
            },
            {
                inversed: true,
                type: 'hasMany',
                target: 'Resources',
                options: { foreignKey: 'resource', targetKey: 'id', as: '_Permissions' },
            },
            {
                type: 'belongsTo',
                target: 'PermissionTypes',
                options: { foreignKey: 'permission_type', targetKey: 'id', as: '_PermissionType' },
            },
            {
                inversed: true,
                type: 'hasMany',
                target: 'PermissionTypes',
                options: { foreignKey: 'permission_type', targetKey: 'id', as: '_Permissions' },
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
                options: { foreignKey: 'status', targetKey: 'id', as: '_Permissions' },
            },
        ];
    }
}
