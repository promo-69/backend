import { DataTypes } from 'sequelize';
import { type RelationsReturn, SequelizeModelBase } from '@database/models/bases/sequelize.model.js';

export default class JobPositionsModel extends SequelizeModelBase {
    static definition() {
        return {
            id: {
                primaryKey: true,
                autoIncrement: true,
                allowNull: true,
                type: DataTypes.INTEGER,
            },
            title: {
                allowNull: false,
                type: DataTypes.STRING(100),
            },
            description: {
                allowNull: true,
                type: DataTypes.STRING(255),
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
            tableName: 'job_positions',
            appRawName: 'job_positions',
        };
    }

    static override relations(): RelationsReturn {
        return [];
    }
}
