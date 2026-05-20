import { DataTypes } from 'sequelize';
import { type RelationsReturn, SequelizeModelBase } from '@database/models/bases/sequelize.model.js';

export default class CatalogAuditLogsModel extends SequelizeModelBase {
	static definition() {
		return {
			id: {
				primaryKey: true,
				autoIncrement: true,
				allowNull: false,
				type: DataTypes.BIGINT,
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
				defaultValue: DataTypes.NOW,
			}
		};
	}

	static config() {
		return {
			timestamps: true,
			paranoid: false,
			createdAt: 'created_at',
			updatedAt: false,
			deletedAt: false,
			isBasicTable: false,
			schema: 'public',
			tableName: 'catalog_audit_logs',
			appRawName: 'catalog-audit-logs',
		};
	}

	static override relations(): RelationsReturn {
		return [
			{
				type: 'belongsTo',
				target: 'Users',
				options: { foreignKey: 'changed_by', targetKey: 'id', as: '_Users' },
			},
			{
				inversed: true,
				type: 'hasMany',
				target: 'Users',
				options: { foreignKey: 'changed_by', targetKey: 'id', as: '_CatalogAuditLogs' },
			},
		];
	}
}
