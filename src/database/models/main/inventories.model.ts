import { DataTypes } from 'sequelize';
import { type RelationsReturn, SequelizeModelBase } from '@database/models/bases/sequelize.model.js';

export default class InventoriesModel extends SequelizeModelBase {
    static definition() {
        return {
            id: {
                primaryKey: true,
                autoIncrement: true,
                allowNull: true,
                type: DataTypes.INTEGER,
            },
            cinema: {
                allowNull: false,
                type: DataTypes.INTEGER,
            },
            product: {
                allowNull: false,
                type: DataTypes.INTEGER,
            },
            minimum_stock: {
                allowNull: false,
                type: DataTypes.INTEGER,
                defaultValue: 0,
            },
            stock: {
                allowNull: false,
                type: DataTypes.INTEGER,
            },
            current_unit_cost_base_currency: {
                allowNull: false,
                type: DataTypes.DECIMAL(10, 2),
                defaultValue: 0,
            },
            status: {
                // <-- agregado
                allowNull: false,
                type: DataTypes.INTEGER,
                defaultValue: 1,
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
            tableName: 'inventories',
            appRawName: 'inventories',
        };
    }

    static override relations(): RelationsReturn {
        return [
            {
                type: 'belongsTo',
                target: 'Cinemas',
                options: { foreignKey: 'cinema', targetKey: 'id', as: '_Cinemas' },
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
                options: { foreignKey: 'product', targetKey: 'id', as: '_Products' },
            },
            {
                inversed: true,
                type: 'hasMany',
                target: 'Products',
                options: { foreignKey: 'product', targetKey: 'id', as: '_Inventories' },
            },
        ];
    }
}
