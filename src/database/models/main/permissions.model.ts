import { DataTypes } from 'sequelize';
import { type RelationsReturn, SequelizeModelBase } from '@database/models/bases/sequelize.model.js';

export default class PermissionsModel extends SequelizeModelBase {
	static definition() {
		return {
			id: {
				primaryKey: true,
				autoIncrement: true,
				allowNull: false,
				type: DataTypes.INTEGER,
			},
			action: {
				allowNull: false,
				type: DataTypes.INTEGER,
			},
			resource: {
				allowNull: false,
				type: DataTypes.INTEGER,
			},
			permission_type: {
				allowNull: false,
				type: DataTypes.INTEGER,
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
			tableName: 'permissions',
			appRawName: 'permissions',
		};
	}

	static override relations(): RelationsReturn {
		return [
			{
				type: 'belongsTo',
				target: 'Actions',
				options: { foreignKey: 'action', targetKey: 'id', as: '_Actions' },
			},
			{
				inversed: true,
				type: 'hasMany',
				target: 'Actions',
				options: { foreignKey: 'action', targetKey: 'id', as: '_Permissions' },
			},
			{
				type: 'belongsTo',
				target: 'Resources',
				options: { foreignKey: 'resource', targetKey: 'id', as: '_Resources' },
			},
			{
				inversed: true,
				type: 'hasMany',
				target: 'Resources',
				options: { foreignKey: 'resource', targetKey: 'id', as: '_Permissions' },
			},
			{
				type: 'belongsTo',
				target: 'PermissionTypes',
				options: { foreignKey: 'permission_type', targetKey: 'id', as: '_PermissionTypes' },
			},
			{
				inversed: true,
				type: 'hasMany',
				target: 'PermissionTypes',
				options: { foreignKey: 'permission_type', targetKey: 'id', as: '_Permissions' },
			},
		];
	}
}
