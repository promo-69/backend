import { DataTypes } from 'sequelize';
import { type RelationsReturn, SequelizeModelBase } from '@database/models/bases/sequelize.model.js';

export default class InventoryMovementsModel extends SequelizeModelBase {
    static definition() {
        return {
            id: {
                primaryKey: true,
                allowNull: true,
                type: DataTypes.INTEGER,
                autoIncrement: true,
            },
            inventory: {
                allowNull: false,
                type: DataTypes.INTEGER,
            },
            operation_type: {
                allowNull: false,
                type: DataTypes.INTEGER,
            },
            quantity: {
                allowNull: false,
                type: DataTypes.INTEGER,
            },
            user: {
                allowNull: false,
                type: DataTypes.INTEGER,
            },
            created_at: {
                allowNull: false,
                type: DataTypes.DATE,
                defaultValue: DataTypes.NOW,
            },
            remarks: {
                allowNull: true,
                type: DataTypes.STRING(255),
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
            tableName: 'inventory_movements',
            appRawName: 'inventory_movements',
            timestamps: false,
        };
    }

    static override relations(): RelationsReturn {
        return [
            {
                type: 'belongsTo',
                target: 'Inventories',
                options: { foreignKey: 'inventory', targetKey: 'id', as: '_Inventory' },
            },
            {
                inversed: true,
                type: 'hasMany',
                target: 'Inventories',
                options: { foreignKey: 'inventory', targetKey: 'id', as: '_InventoryMovements' },
            },
            {
                type: 'belongsTo',
                target: 'OperationTypes',
                options: { foreignKey: 'operation_type', targetKey: 'id', as: '_OperationType' },
            },
            {
                inversed: true,
                type: 'hasMany',
                target: 'OperationTypes',
                options: { foreignKey: 'operation_type', targetKey: 'id', as: '_InventoryMovements' },
            },
            {
                type: 'belongsTo',
                target: 'Users',
                options: { foreignKey: 'user', targetKey: 'id', as: '_User' },
            },
            {
                inversed: true,
                type: 'hasMany',
                target: 'Users',
                options: { foreignKey: 'user', targetKey: 'id', as: '_InventoryMovements' },
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
                options: { foreignKey: 'status', targetKey: 'id', as: '_InventoryMovements' },
            },
        ];
    }
}
