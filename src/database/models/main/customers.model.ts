import { DataTypes } from 'sequelize';
import { type RelationsReturn, SequelizeModelBase } from '@database/models/bases/sequelize.model.js';

export default class CustomersModel extends SequelizeModelBase {
    static definition() {
        return {
            id: {
                primaryKey: true,
                autoIncrement: true,
                allowNull: true,
                type: DataTypes.INTEGER,
            },
            person: {
                allowNull: false,
                type: DataTypes.INTEGER,
            },
            loyalty_level: {
                allowNull: false,
                type: DataTypes.INTEGER,
                defaultValue: 1,
            },
            level_progress_points: {
                allowNull: false,
                type: DataTypes.INTEGER,
                defaultValue: 0,
            },
            registration_date: {
                allowNull: false,
                type: DataTypes.DATE,
                defaultValue: DataTypes.NOW,
            },
            deleted_at: {
                allowNull: true,
                type: DataTypes.DATE,
            },
        };
    }
    static config() {
        return {
            timestamps: true,
            paranoid: true,
            createdAt: false,
            updatedAt: false,
            deletedAt: 'deleted_at',
            isBasicTable: true,
            schema: 'public',
            tableName: 'customers',
            appRawName: 'customers',
        };
    }

    static override relations(): RelationsReturn {
        return [
            {
                type: 'belongsTo',
                target: 'People',
                options: { foreignKey: 'person', targetKey: 'id', as: '_People' },
            },
            {
                inversed: true,
                type: 'hasMany',
                target: 'People',
                options: { foreignKey: 'person', targetKey: 'id', as: '_Customers' },
            },
            {
                type: 'belongsTo',
                target: 'LoyaltyLevels',
                options: { foreignKey: 'loyalty_level', targetKey: 'id', as: '_LoyaltyLevels' },
            },
            {
                inversed: true,
                type: 'hasMany',
                target: 'LoyaltyLevels',
                options: { foreignKey: 'loyalty_level', targetKey: 'id', as: '_Customers' },
            },
        ];
    }
}
