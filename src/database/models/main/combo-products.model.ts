import { DataTypes } from 'sequelize';
import { type RelationsReturn, SequelizeModelBase } from '@database/models/bases/sequelize.model.js';

export default class ComboProductsModel extends SequelizeModelBase {
    static definition() {
        return {
            id: {
                primaryKey: true,
                allowNull: true,
                type: DataTypes.INTEGER,
                autoIncrement: true,
            },
            combo: {
                allowNull: false,
                type: DataTypes.INTEGER,
            },
            product: {
                allowNull: false,
                type: DataTypes.INTEGER,
            },
            quantity: {
                allowNull: false,
                type: DataTypes.INTEGER,
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
            tableName: 'combo_products',
            appRawName: 'combo_products',
            timestamps: false,
        };
    }

    static override relations(): RelationsReturn {
        return [
            {
                type: 'belongsTo',
                target: 'Combos',
                options: { foreignKey: 'combo', targetKey: 'id', as: '_Combo' },
            },
            {
                inversed: true,
                type: 'hasMany',
                target: 'Combos',
                options: { foreignKey: 'combo', targetKey: 'id', as: '_ComboProducts' },
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
                options: { foreignKey: 'product', targetKey: 'id', as: '_ComboProducts' },
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
                options: { foreignKey: 'status', targetKey: 'id', as: '_ComboProducts' },
            },
        ];
    }
}
