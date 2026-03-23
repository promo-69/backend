import { DataTypes, Sequelize } from 'sequelize';
import { type RelationsReturn, SequelizeModelBase } from '@database/models/bases/sequelize.model.js';

export default class SystemAccessModel extends SequelizeModelBase {
    static definition() {
        return {
            id: {
                primaryKey: true,
                allowNull: true,
                type: DataTypes.INTEGER,
                autoIncrement: true,
            },
            person: {
                allowNull: false,
                type: DataTypes.INTEGER,
            },
            username: {
                allowNull: false,
                type: DataTypes.STRING(16),
            },
            password: {
                allowNull: false,
                type: DataTypes.STRING(20),
            },
            registrationDate: {
                allowNull: false,
                type: DataTypes.DATEONLY,
                defaultValue: Sequelize.literal('now()'),
            },
            lastLoginDate: {
                allowNull: true,
                type: DataTypes.DATE,
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
            tableName: 'system_accesses',
            appRawName: 'system-accesses',
        };
    }

    static override relations(): RelationsReturn {
        return [
            {
                type: 'belongsTo',
                target: 'People',
                options: {
                    foreignKey: 'person',
                    targetKey: 'id',
                    as: '_People',
                },
            },
            {
                inversed: true,
                type: 'hasMany',
                target: 'People',
                options: {
                    foreignKey: 'person',
                    targetKey: 'id',
                    as: '_SystemAccesses',
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
                    as: '_SystemAccesses',
                },
            },
        ];
    }
}
