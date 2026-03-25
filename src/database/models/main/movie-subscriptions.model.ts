import { DataTypes } from 'sequelize';
import { type RelationsReturn, SequelizeModelBase } from '@database/models/bases/sequelize.model.js';

export default class MovieSubscriptionsModel extends SequelizeModelBase {
    static definition() {
        return {
            id: {
                primaryKey: true,
                allowNull: true,
                type: DataTypes.INTEGER,
                autoIncrement: true,
            },
            customer: {
                allowNull: false,
                type: DataTypes.INTEGER,
            },
            movie: {
                allowNull: false,
                type: DataTypes.INTEGER,
            },
            is_notified: {
                allowNull: false,
                type: DataTypes.BOOLEAN,
                defaultValue: false,
            },
            created_at: {
                allowNull: false,
                type: DataTypes.DATE,
                defaultValue: DataTypes.NOW,
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
            tableName: 'movie_subscriptions',
            appRawName: 'movie_subscriptions',
            timestamps: false,
        };
    }

    static override relations(): RelationsReturn {
        return [
            {
                type: 'belongsTo',
                target: 'Customers',
                options: { foreignKey: 'customer', targetKey: 'id', as: '_Customer' },
            },
            {
                inversed: true,
                type: 'hasMany',
                target: 'Customers',
                options: { foreignKey: 'customer', targetKey: 'id', as: '_MovieSubscriptions' },
            },
            {
                type: 'belongsTo',
                target: 'Movies',
                options: { foreignKey: 'movie', targetKey: 'id', as: '_Movie' },
            },
            {
                inversed: true,
                type: 'hasMany',
                target: 'Movies',
                options: { foreignKey: 'movie', targetKey: 'id', as: '_MovieSubscriptions' },
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
                options: { foreignKey: 'status', targetKey: 'id', as: '_MovieSubscriptions' },
            },
        ];
    }
}
