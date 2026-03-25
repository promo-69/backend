import { DataTypes } from 'sequelize';
import { type RelationsReturn, SequelizeModelBase } from '@database/models/bases/sequelize.model.js';

export default class TicketsModel extends SequelizeModelBase {
    static definition() {
        return {
            id: {
                primaryKey: true,
                allowNull: true,
                type: DataTypes.INTEGER,
                autoIncrement: true,
            },
            order: {
                allowNull: false,
                type: DataTypes.INTEGER,
            },
            showtime: {
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
            price_modifier: {
                allowNull: true,
                type: DataTypes.INTEGER,
            },
            price: {
                allowNull: false,
                type: DataTypes.DECIMAL(10, 2),
            },
            applied_exchange_rate: {
                allowNull: false,
                type: DataTypes.INTEGER,
            },
            qr_code: {
                allowNull: false,
                type: DataTypes.STRING(500),
            },
            validation_time: {
                allowNull: true,
                type: DataTypes.DATE,
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
            tableName: 'tickets',
            appRawName: 'tickets',
            timestamps: false,
        };
    }

    static override relations(): RelationsReturn {
        return [
            { type: 'belongsTo', target: 'Orders', options: { foreignKey: 'order', targetKey: 'id', as: '_Order' } },
            { inversed: true, type: 'hasMany', target: 'Orders', options: { foreignKey: 'order', targetKey: 'id', as: '_Tickets' } },
            { type: 'belongsTo', target: 'Showtimes', options: { foreignKey: 'showtime', targetKey: 'id', as: '_Showtime' } },
            { inversed: true, type: 'hasMany', target: 'Showtimes', options: { foreignKey: 'showtime', targetKey: 'id', as: '_Tickets' } },
            { type: 'belongsTo', target: 'Seats', options: { foreignKey: 'seat', targetKey: 'id', as: '_Seat' } },
            { inversed: true, type: 'hasOne', target: 'Seats', options: { foreignKey: 'seat', targetKey: 'id', as: '_Ticket' } },
            { type: 'belongsTo', target: 'PriceModifiers', options: { foreignKey: 'price_modifier', targetKey: 'id', as: '_PriceModifier' } },
            { inversed: true, type: 'hasMany', target: 'PriceModifiers', options: { foreignKey: 'price_modifier', targetKey: 'id', as: '_Tickets' } },
            { type: 'belongsTo', target: 'ExchangeRates', options: { foreignKey: 'applied_exchange_rate', targetKey: 'id', as: '_AppliedExchangeRate' } },
            { inversed: true, type: 'hasMany', target: 'ExchangeRates', options: { foreignKey: 'applied_exchange_rate', targetKey: 'id', as: '_Tickets' } },
            { type: 'belongsTo', target: 'Statuses', options: { foreignKey: 'status', targetKey: 'id', as: '_Status' } },
            { inversed: true, type: 'hasMany', target: 'Statuses', options: { foreignKey: 'status', targetKey: 'id', as: '_Tickets' } },
        ];
    }
}
