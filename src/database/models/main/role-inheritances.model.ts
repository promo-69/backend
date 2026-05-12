import { DataTypes } from 'sequelize';
import { type RelationsReturn, SequelizeModelBase } from '@database/models/bases/sequelize.model.js';

export default class RoleInheritancesModel extends SequelizeModelBase {
	static definition() {
		return {
			id: {
				primaryKey: true,
				autoIncrement: true,
				allowNull: true,
				type: DataTypes.INTEGER,
			},
			parent_role: {
				allowNull: false,
				type: DataTypes.INTEGER,
			},
			child_role: {
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
			isBasicTable: true,
			schema: 'public',
			tableName: 'role_inheritances',
			appRawName: 'role_inheritances',
		};
	}

	static override relations(): RelationsReturn {
		return [
			{
				type: 'belongsTo',
				target: 'Roles',
				options: { foreignKey: 'parent_role', targetKey: 'id', as: '_ParentRoles' },
			},
			{
				inversed: true,
				type: 'hasMany',
				target: 'Roles',
				options: { foreignKey: 'parent_role', targetKey: 'id', as: '_RoleInheritancesParent' },
			},
			{
				type: 'belongsTo',
				target: 'Roles',
				options: { foreignKey: 'child_role', targetKey: 'id', as: '_ChildRoles' },
			},
			{
				inversed: true,
				type: 'hasMany',
				target: 'Roles',
				options: { foreignKey: 'child_role', targetKey: 'id', as: '_RoleInheritancesChild' },
			},
		];
	}
}
