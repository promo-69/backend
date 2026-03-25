import { DataTypes } from 'sequelize';
import { type RelationsReturn, SequelizeModelBase } from '@database/models/bases/sequelize.model.js';

export default class InventoriesModel extends SequelizeModelBase {
    static definition() {
        return {
            id: {
                primaryKey: true,
                allowNull: true,
                type: DataTypes.INTEGER,
                autoIncrement: true,
            },
            cinema: {
                allowNull: false,
                type: DataTypes.INTEGER,
            },
            product: {
                allowNull: false,
                type: DataTypes.INTEGER,
            },
            stock: {
                allowNull: false,
                type: DataTypes.INTEGER,
            },
            status: {
                allowNull: false,
                type: DataTypes.INTEGER,
            },
        };
    }

    static config() {
        return {
            isBasicTable: false,
            schema: 'public',
            tableName: 'inventories',
            appRawName: 'inventories',
            timestamps: false,
        };
    }

    static override relations(): RelationsReturn {
        return [
            {
                type: 'belongsTo',
                target: 'Cinemas',
                options: { foreignKey: 'cinema', targetKey: 'id', as: '_Cinema' },
            },
            {
                inversed: true,
                type: 'hasMany',
                target: 'Cinemas',
                options: { foreignKey: 'cinema', targetKey: 'id', as: '_Inventories' },
            },
            {
                type: 'belongsTo',
                target: 'Products',
                options: { foreignKey: 'product', targetKey: 'id', as: '_Product' },
            },
            {
                inversed: true,
                type: 'hasMany',
                target: 'Products',
                options: { foreignKey: 'product', targetKey: 'id', as: '_Inventories' },
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
                options: { foreignKey: 'status', targetKey: 'id', as: '_Inventories' },
            },
        ];
    }
}
