import { DataTypes } from 'sequelize';
import { type RelationsReturn, SequelizeModelBase } from '@database/models/bases/sequelize.model.js';

export default class RolePermissionsModel extends SequelizeModelBase {
	static definition() {
		return {
			id: {
				primaryKey: true,
				autoIncrement: true,
				allowNull: false,
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
			timestamps: true,
			paranoid: true,
			createdAt: false,
			updatedAt: false,
			deletedAt: 'deleted_at',
			isBasicTable: false,
			schema: 'public',
			tableName: 'role_permissions',
			appRawName: 'role-permissions',
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
				type: 'belongsTo',
				target: 'Permissions',
				options: { foreignKey: 'permission', targetKey: 'id', as: '_Permissions' },
			},
		];
	}
}
