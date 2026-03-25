import { DataTypes } from 'sequelize';
import { type RelationsReturn, SequelizeModelBase } from '@database/models/bases/sequelize.model.js';

export default class RoleInheritancesModel extends SequelizeModelBase {
    static definition() {
        return {
            id: {
                primaryKey: true,
                allowNull: true,
                type: DataTypes.INTEGER,
                autoIncrement: true,
            },
            parent_role: {
                allowNull: false,
                type: DataTypes.INTEGER,
            },
            child_role: {
                allowNull: false,
                type: DataTypes.INTEGER,
            },
            status: {
                allowNull: false,
                type: DataTypes.INTEGER,
                defaultValue: 1
            },
        };
    }

    static config() {
        return {
            isBasicTable: false,
            schema: 'public',
            tableName: 'role_inheritances',
            appRawName: 'role_inheritances',
            timestamps: false,
        };
    }

    static override relations(): RelationsReturn {
        return [
            {
                type: 'belongsTo',
                target: 'Roles',
                options: { foreignKey: 'parent_role', targetKey: 'id', as: '_ParentRole' },
            },
            {
                inversed: true,
                type: 'hasMany',
                target: 'Roles',
                options: { foreignKey: 'parent_role', targetKey: 'id', as: '_ChildInheritances' },
            },
            {
                type: 'belongsTo',
                target: 'Roles',
                options: { foreignKey: 'child_role', targetKey: 'id', as: '_ChildRole' },
            },
            {
                inversed: true,
                type: 'hasMany',
                target: 'Roles',
                options: { foreignKey: 'child_role', targetKey: 'id', as: '_ParentInheritances' },
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
                options: { foreignKey: 'status', targetKey: 'id', as: '_RoleInheritances' },
            },
        ];
    }
}
