import { DataTypes } from 'sequelize';
import { type RelationsReturn, SequelizeModelBase } from '@database/models/bases/sequelize.model.js';

export default class RolesModel extends SequelizeModelBase {
	static definition() {
		return {
			id: {
				primaryKey: true,
				autoIncrement: true,
				allowNull: false,
				type: DataTypes.INTEGER,
			},
			code: {
				allowNull: false,
				type: DataTypes.STRING(50),
			},
			name: {
				allowNull: false,
				type: DataTypes.STRING(100),
			},
			description: {
				allowNull: false,
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
			isBasicTable: false,
			schema: 'public',
			tableName: 'roles',
			appRawName: 'roles',
		};
	}

	static override relations(): RelationsReturn {
		return [
			{
				type: 'hasMany',
				target: 'RolePermissions',
				options: { foreignKey: 'role', targetKey: 'id', as: '_RolePermissions' },
			},
		];
	}
}
