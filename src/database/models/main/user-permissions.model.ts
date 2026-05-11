import { DataTypes } from 'sequelize';
import { type RelationsReturn, SequelizeModelBase } from '@database/models/bases/sequelize.model.js';

export default class UserPermissionsModel extends SequelizeModelBase {
	static definition() {
		return {
			id: {
				primaryKey: true,
				autoIncrement: true,
				allowNull: true,
				type: DataTypes.INTEGER,
			},
			user: {
				allowNull: false,
				type: DataTypes.INTEGER,
			},
			permission: {
				allowNull: false,
				type: DataTypes.INTEGER,
			},
			is_granted: {
				allowNull: false,
				type: DataTypes.BOOLEAN,
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
			tableName: 'user_permissions',
			appRawName: 'user_permissions',
			timestamps: false,
		};
	}

	static override relations(): RelationsReturn {
		return [
			{
				type: 'belongsTo',
				target: 'Users',
				options: { foreignKey: 'user', targetKey: 'id', as: '_Users' },
			},
			{
				inversed: true,
				type: 'hasMany',
				target: 'Users',
				options: { foreignKey: 'user', targetKey: 'id', as: '_UserPermissions' },
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
				options: { foreignKey: 'permission', targetKey: 'id', as: '_UserPermissions' },
			},
		];
	}
}
