import { DataTypes } from 'sequelize';
import { type RelationsReturn, SequelizeModelBase } from '@database/models/bases/sequelize.model.js';

export default class ProductsModel extends SequelizeModelBase {
    static definition() {
        return {
            id: {
                primaryKey: true,
                autoIncrement: true,
                allowNull: true,
                type: DataTypes.INTEGER,
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
            image_url: {
                allowNull: true,
                type: DataTypes.STRING(500),
            },
            status: {
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
            tableName: 'products',
            appRawName: 'products',
        };
    }

    static override relations(): RelationsReturn {
        return [
            {
                type: 'belongsTo',
                target: 'ProductCategories',
                options: { foreignKey: 'product_category', targetKey: 'id', as: '_ProductCategories' },
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
                options: { foreignKey: 'currency', targetKey: 'id', as: '_Currencies' },
            },
            {
                inversed: true,
                type: 'hasMany',
                target: 'Currencies',
                options: { foreignKey: 'currency', targetKey: 'id', as: '_Products' },
            },
        ];
    }
}
