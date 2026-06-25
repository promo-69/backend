import { DataTypes } from 'sequelize';
import { type RelationsReturn, SequelizeModelBase } from '@database/models/bases/sequelize.model.js';

/**
 * Diseño de datos:
 *  - Los datos de contacto (nombre, email, teléfono) viven en people
 *    a través de la cadena: customer → customers.person → people.
 *  - La sucursal se guarda directamente en cinema para facilitar filtros
 *    y evitar joins innecesarios. Se calcula al crear la solicitud
 *    a partir de room → rooms.cinema.
 *  - customer es siempre NOT NULL. Para solicitudes públicas (sin cuenta)
 *    el flujo crea people + customers antes de insertar la solicitud.
 */
export default class RentalRequestsModel extends SequelizeModelBase {
    static definition() {
        return {
            id: { primaryKey: true, autoIncrement: true, allowNull: false, type: DataTypes.INTEGER },
            // Solicitante — siempre presente, incluso para solicitudes anónimas
            customer: { allowNull: false, type: DataTypes.INTEGER },
            // Sucursal donde se realiza la solicitud (se calcula de la sala)
            cinema: { allowNull: false, type: DataTypes.INTEGER },
            // Sala solicitada
            room: { allowNull: false, type: DataTypes.INTEGER },
            // Tipo de evento (booking_types: id 3 = Alquiler Privado)
            event_type: { allowNull: false, type: DataTypes.INTEGER },
            // Reserva de sala — NULL hasta que el gerente APRUEBA (status → 2)
            booking: { allowNull: true, type: DataTypes.INTEGER },
            // Detalles del evento
            event_name: { allowNull: false, type: DataTypes.STRING(255) },
            event_description: { allowNull: true, type: DataTypes.TEXT },
            event_date: { allowNull: false, type: DataTypes.DATEONLY },
            attendees: { allowNull: true, type: DataTypes.INTEGER },
            // Horario solicitado
            requested_start_time: { allowNull: false, type: DataTypes.DATE },
            requested_end_time: { allowNull: false, type: DataTypes.DATE },
            // Ciclo de vida (FK → rental_request_statuses)
            status: { allowNull: false, type: DataTypes.INTEGER },
            // Precio fijado por el gerente al aprobar
            currency: { allowNull: true, type: DataTypes.INTEGER },
            price: { allowNull: true, type: DataTypes.DECIMAL(10, 2) },
            deleted_at: { allowNull: true, type: DataTypes.DATE },
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
            tableName: 'rental_requests',
            appRawName: 'rental-requests',
        };
    }

    static override relations(): RelationsReturn {
        return [
            // customer → datos del solicitante (people vía customers)
            {
                type: 'belongsTo',
                target: 'Customers',
                options: { foreignKey: 'customer', targetKey: 'id', as: '_Customers' },
            },
            {
                inversed: true,
                type: 'hasMany',
                target: 'Customers',
                options: { foreignKey: 'customer', targetKey: 'id', as: '_RentalRequests' },
            },
            // cinema → sucursal
            {
                type: 'belongsTo',
                target: 'Cinemas',
                options: { foreignKey: 'cinema', targetKey: 'id', as: '_Cinemas' },
            },
            {
                inversed: true,
                type: 'hasMany',
                target: 'Cinemas',
                options: { foreignKey: 'cinema', targetKey: 'id', as: '_RentalRequests' },
            },
            // room → sala solicitada
            { type: 'belongsTo', target: 'Rooms', options: { foreignKey: 'room', targetKey: 'id', as: '_Rooms' } },
            {
                inversed: true,
                type: 'hasMany',
                target: 'Rooms',
                options: { foreignKey: 'room', targetKey: 'id', as: '_RentalRequests' },
            },
            // event_type → tipo de evento
            {
                type: 'belongsTo',
                target: 'BookingTypes',
                options: { foreignKey: 'event_type', targetKey: 'id', as: '_EventTypes' },
            },
            {
                inversed: true,
                type: 'hasMany',
                target: 'BookingTypes',
                options: { foreignKey: 'event_type', targetKey: 'id', as: '_RentalRequests' },
            },
            // booking → reserva de sala (existe solo tras aprobación)
            {
                type: 'belongsTo',
                target: 'RoomBookings',
                options: { foreignKey: 'booking', targetKey: 'id', as: '_RoomBookings' },
            },
            {
                inversed: true,
                type: 'hasMany',
                target: 'RoomBookings',
                options: { foreignKey: 'booking', targetKey: 'id', as: '_RentalRequests' },
            },
            // status → ciclo de vida
            {
                type: 'belongsTo',
                target: 'RentalRequestStatuses',
                options: { foreignKey: 'status', targetKey: 'id', as: '_Statuses' },
            },
            {
                inversed: true,
                type: 'hasMany',
                target: 'RentalRequestStatuses',
                options: { foreignKey: 'status', targetKey: 'id', as: '_RentalRequests' },
            },
            // currency → moneda del precio de la proforma
            {
                type: 'belongsTo',
                target: 'Currencies',
                options: { foreignKey: 'currency', targetKey: 'id', as: '_Currencies' },
            },
            {
                inversed: true,
                type: 'hasMany',
                target: 'Currencies',
                options: { foreignKey: 'currency', targetKey: 'id', as: '_RentalRequests' },
            },
        ];
    }
}
