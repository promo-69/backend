import { DataTypes } from 'sequelize';
import { type RelationsReturn, SequelizeModelBase } from '@database/models/bases/sequelize.model.js';

export default class TicketsModel extends SequelizeModelBase {
    static definition() {
        return {
            id: {
                primaryKey: true,
                autoIncrement: true,
                allowNull: false,
                type: DataTypes.INTEGER,
            },
            order: {
                allowNull: false,
                type: DataTypes.INTEGER,
            },
            booking: {
                allowNull: false,
                type: DataTypes.INTEGER,
            },
            seat: {
                allowNull: false,
                type: DataTypes.INTEGER,
            },
            original_price: {
                allowNull: false,
                type: DataTypes.DECIMAL(10, 2),
            },
            price: {
                allowNull: false,
                type: DataTypes.DECIMAL(10, 2),
            },
            quoted_exchange_rate: {
                allowNull: false,
                type: DataTypes.INTEGER,
            },
            qr_code: {
                allowNull: true,
                type: DataTypes.STRING(500),
            },
            validation_time: {
                allowNull: true,
                type: DataTypes.DATE,
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
            isBasicTable: false,
            schema: 'public',
            tableName: 'tickets',
            appRawName: 'tickets',
        };
    }

    static override relations(): RelationsReturn {
        return [
            {
                type: 'belongsTo',
                target: 'Orders',
                options: { foreignKey: 'order', targetKey: 'id', as: '_Orders' },
            },
            {
                inversed: true,
                type: 'hasMany',
                target: 'Orders',
                options: { foreignKey: 'order', targetKey: 'id', as: '_Tickets' },
            },
            {
                type: 'belongsTo',
                target: 'RoomBookings',
                options: { foreignKey: 'booking', targetKey: 'id', as: '_RoomBookings' },
            },
            {
                inversed: true,
                type: 'hasMany',
                target: 'RoomBookings',
                options: { foreignKey: 'booking', targetKey: 'id', as: '_Tickets' },
            },
            {
                type: 'belongsTo',
                target: 'Seats',
                options: { foreignKey: 'seat', targetKey: 'id', as: '_Seats' },
            },
            {
                inversed: true,
                type: 'hasMany',
                target: 'Seats',
                options: { foreignKey: 'seat', targetKey: 'id', as: '_Tickets' },
            },
            {
                type: 'belongsTo',
                target: 'ExchangeRates',
                options: { foreignKey: 'quoted_exchange_rate', targetKey: 'id', as: '_ExchangeRates' },
            },
            {
                inversed: true,
                type: 'hasMany',
                target: 'ExchangeRates',
                options: { foreignKey: 'quoted_exchange_rate', targetKey: 'id', as: '_Tickets' },
            },
        ];
    }
}
