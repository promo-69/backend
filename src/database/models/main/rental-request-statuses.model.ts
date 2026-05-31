import { DataTypes } from 'sequelize';
import { type RelationsReturn, SequelizeModelBase } from '@database/models/bases/sequelize.model.js';

export default class RentalRequestStatusesModel extends SequelizeModelBase {
    static definition() {
        return {
            id: { primaryKey: true, autoIncrement: true, allowNull: false, type: DataTypes.INTEGER },
            description: { allowNull: false, type: DataTypes.STRING(100) },
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
            tableName: 'rental_request_statuses',
            appRawName: 'rental-request-statuses',
        };
    }

    static override relations(): RelationsReturn {
        return [
            {
                inversed: true,
                type: 'hasMany',
                target: 'RentalRequests',
                options: { foreignKey: 'status', targetKey: 'id', as: '_RentalRequests' },
            },
        ];
    }
}
