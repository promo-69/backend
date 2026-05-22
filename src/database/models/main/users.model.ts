import { DataTypes } from 'sequelize';
import { type RelationsReturn, SequelizeModelBase } from '@database/models/bases/sequelize.model.js';

export default class UsersModel extends SequelizeModelBase {
	static definition() {
		return {
			id: {
				primaryKey: true,
				autoIncrement: true,
				allowNull: false,
				type: DataTypes.INTEGER,
			},
			person: {
				allowNull: false,
				type: DataTypes.INTEGER,
			},
			user_type: {
				allowNull: false,
				type: DataTypes.INTEGER,
			},
			role: {
				allowNull: true,
				type: DataTypes.INTEGER,
			},
			email: {
				allowNull: false,
				type: DataTypes.STRING(100),
			},
			password: {
				allowNull: false,
				type: DataTypes.STRING(255),
			},
			signup_code: {
				allowNull: true,
				type: DataTypes.STRING(60),
			},
			signup_verified_at: {
				allowNull: true,
				type: DataTypes.DATE,
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
			createdAt: 'created_at',
			updatedAt: 'updated_at',
			deletedAt: 'deleted_at',
			isBasicTable: false,
			schema: 'public',
			tableName: 'users',
			appRawName: 'users',
		};
	}

	static override relations(): RelationsReturn {
		return [
			{
				type: 'belongsTo',
				target: 'People',
				options: { foreignKey: 'person', targetKey: 'id', as: '_People' },
			},
			{
				inversed: true,
				type: 'hasMany',
				target: 'People',
				options: { foreignKey: 'person', targetKey: 'id', as: '_Users' },
			},
			{
				type: 'belongsTo',
				target: 'UserTypes',
				options: { foreignKey: 'user_type', targetKey: 'id', as: '_UserTypes' },
			},
			{
				inversed: true,
				type: 'hasMany',
				target: 'UserTypes',
				options: { foreignKey: 'user_type', targetKey: 'id', as: '_Users' },
			},
			{
				type: 'belongsTo',
				target: 'Roles',
				options: { foreignKey: 'role', targetKey: 'id', as: '_Roles' },
			},
			{
				inversed: true,
				type: 'hasMany',
				target: 'Roles',
				options: { foreignKey: 'role', targetKey: 'id', as: '_Users' },
			},
		];
	}
}
