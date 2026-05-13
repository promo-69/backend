import { DataTypes } from 'sequelize';
import { type RelationsReturn, SequelizeModelBase } from '@database/models/bases/sequelize.model.js';

export default class ProductCategoriesModel extends SequelizeModelBase {
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
                type: DataTypes.STRING(100),
                unique: true,
            },
            description: {
                allowNull: false,
                type: DataTypes.STRING(255),
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
            tableName: 'product_categories',
            appRawName: 'product_categories',
        };
    }

    static override relations(): RelationsReturn {
        return [];
    }
}
