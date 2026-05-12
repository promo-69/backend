import { DataTypes } from 'sequelize';
import { type RelationsReturn, SequelizeModelBase } from '@database/models/bases/sequelize.model.js';

export default class UsersLoginsModel extends SequelizeModelBase {
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
			device: {
				allowNull: true,
				type: DataTypes.STRING(500),
			},
			jti: {
				allowNull: false,
				type: DataTypes.STRING(255),
			},
			expires_at: {
				allowNull: false,
				type: DataTypes.DATE,
			},
			created_at: {
				allowNull: false,
				type: DataTypes.DATE,
				defaultValue: DataTypes.NOW,
			},
			updated_at: {
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
			isBasicTable: true,
			schema: 'public',
			tableName: 'users_logins',
			appRawName: 'users_logins',
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
				options: { foreignKey: 'user', targetKey: 'id', as: '_UsersLogins' },
			},
		];
	}
}
