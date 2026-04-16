import { DataTypes } from 'sequelize';
import { type RelationsReturn, SequelizeModelBase } from '@database/models/bases/sequelize.model.js';

export default class UsersLoginsModel extends SequelizeModelBase {
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
            device: {
                allowNull: true,
                type: DataTypes.STRING(500),
            },
            jti: {
                allowNull: false,
                type: DataTypes.STRING(255),
                unique: true,
            },
            token_status: {
                allowNull: false,
                type: DataTypes.INTEGER,
                defaultValue: 1,
            },
            expires_at: {
                allowNull: false,
                type: DataTypes.DATE,
            },
            created_at: {
                allowNull: false,
                type: DataTypes.DATE,
                defaultValue: DataTypes.NOW,
            },
            updated_at: {
                allowNull: true,
                type: DataTypes.DATE,
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
            tableName: 'users_logins',
            appRawName: 'users-logins',
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
                options: { foreignKey: 'user', targetKey: 'id', as: '_UsersLogins' },
            },
        ];
    }
}
