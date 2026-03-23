import { DataTypes } from 'sequelize';
import { type RelationsReturn, SequelizeModelBase } from '@database/models/bases/sequelize.model.js';

export default class UserRolesModel extends SequelizeModelBase {
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
            user: {
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
            tableName: 'user_roles',
            appRawName: 'user-roles',
        };
    }

    static override relations(): RelationsReturn {
        return [
            {
                type: 'belongsTo',
                target: 'SystemRoles',
                options: {
                    foreignKey: 'role',
                    targetKey: 'id',
                    as: '_Roles',
                },
            },
            {
                inversed: true,
                type: 'hasMany',
                target: 'SystemRoles',
                options: {
                    foreignKey: 'role',
                    targetKey: 'id',
                    as: '_UserRoles',
                },
            },
            {
                type: 'belongsTo',
                target: 'SystemAccess',
                options: {
                    foreignKey: 'user',
                    targetKey: 'id',
                    as: '_SystemAccess',
                },
            },
            {
                inversed: true,
                type: 'hasMany',
                target: 'SystemAccess',
                options: {
                    foreignKey: 'user',
                    targetKey: 'id',
                    as: '_UserRoles',
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
                    as: '_UserRoles',
                },
            },
        ];
    }
}
