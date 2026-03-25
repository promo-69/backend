import { DataTypes } from 'sequelize';
import { type RelationsReturn, SequelizeModelBase } from '@database/models/bases/sequelize.model.js';

export default class ProductsModel extends SequelizeModelBase {
    static definition() {
        return {
            id: {
                primaryKey: true,
                allowNull: true,
                type: DataTypes.INTEGER,
                autoIncrement: true,
            },
            name: {
                allowNull: false,
                type: DataTypes.STRING(255),
            },
            sku: {
                allowNull: false,
                type: DataTypes.STRING(100),
            },
            product_category: {
                allowNull: false,
                type: DataTypes.INTEGER,
            },
            currency: {
                allowNull: false,
                type: DataTypes.INTEGER,
            },
            price: {
                allowNull: false,
                type: DataTypes.DECIMAL(10, 2),
            },
            earned_loyalty_points: {
                allowNull: true,
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
            tableName: 'products',
            appRawName: 'products',
            timestamps: false,
        };
    }

    static override relations(): RelationsReturn {
        return [
            {
                type: 'belongsTo',
                target: 'ProductCategories',
                options: { foreignKey: 'product_category', targetKey: 'id', as: '_ProductCategory' },
            },
            {
                inversed: true,
                type: 'hasMany',
                target: 'ProductCategories',
                options: { foreignKey: 'product_category', targetKey: 'id', as: '_Products' },
            },
            {
                type: 'belongsTo',
                target: 'Currencies',
                options: { foreignKey: 'currency', targetKey: 'id', as: '_Currency' },
            },
            {
                inversed: true,
                type: 'hasMany',
                target: 'Currencies',
                options: { foreignKey: 'currency', targetKey: 'id', as: '_Products' },
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
                options: { foreignKey: 'status', targetKey: 'id', as: '_Products' },
            },
        ];
    }
}
