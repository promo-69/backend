import { DataTypes } from 'sequelize';
import { type RelationsReturn, SequelizeModelBase } from '@database/models/bases/sequelize.model.js';

export default class RolePermissionsModel extends SequelizeModelBase {
	static definition() {
		return {
			id: {
				primaryKey: true,
				autoIncrement: true,
				allowNull: true,
				type: DataTypes.INTEGER,
			},
			role: {
				allowNull: false,
				type: DataTypes.INTEGER,
			},
			permission: {
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
			isBasicTable: true,
			schema: 'public',
			tableName: 'role_permissions',
			appRawName: 'role_permissions',
			timestamps: false,
		};
	}

	static override relations(): RelationsReturn {
		return [
			{
				type: 'belongsTo',
				target: 'Roles',
				options: { foreignKey: 'role', targetKey: 'id', as: '_Roles' },
			},
			{
				inversed: true,
				type: 'hasMany',
				target: 'Roles',
				options: { foreignKey: 'role', targetKey: 'id', as: '_RolePermissions' },
			},
			{
				type: 'belongsTo',
				target: 'Permissions',
				options: { foreignKey: 'permission', targetKey: 'id', as: '_Permissions' },
			},
			{
				inversed: true,
				type: 'hasMany',
				target: 'Permissions',
				options: { foreignKey: 'permission', targetKey: 'id', as: '_RolePermissions' },
			},
		];
	}
}
