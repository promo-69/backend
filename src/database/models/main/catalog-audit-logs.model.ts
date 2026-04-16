import { DataTypes } from 'sequelize';
import { type RelationsReturn, SequelizeModelBase } from '@database/models/bases/sequelize.model.js';

export default class CatalogAuditLogsModel extends SequelizeModelBase {
    static definition() {
        return {
            id: {
                primaryKey: true,
                allowNull: false,
                type: DataTypes.BIGINT,
                autoIncrement: true,
            },
            table_name: {
                allowNull: false,
                type: DataTypes.STRING(100),
            },
            record_id: {
                allowNull: false,
                type: DataTypes.INTEGER,
            },
            action: {
                allowNull: false,
                type: DataTypes.STRING(10),
            },
            changed_by: {
                allowNull: true,
                type: DataTypes.INTEGER,
            },
            previous_data: {
                allowNull: true,
                type: DataTypes.JSONB,
            },
            new_data: {
                allowNull: true,
                type: DataTypes.JSONB,
            },
            created_at: {
                allowNull: false,
                type: DataTypes.DATE,
            },
        };
    }

    static config() {
        return {
            isBasicTable: false,
            schema: 'public',
            tableName: 'catalog_audit_logs',
            appRawName: 'catalog_audit_logs',
            timestamps: false,
        };
    }

    static override relations(): RelationsReturn {
        return [];
    }
}
