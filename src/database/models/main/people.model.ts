import { DataTypes } from 'sequelize';
import { type RelationsReturn, SequelizeModelBase } from '@database/models/bases/sequelize.model.js';

export default class PeopleModel extends SequelizeModelBase {
	static definition() {
		return {
			id: {
				primaryKey: true,
				autoIncrement: true,
				allowNull: true,
				type: DataTypes.INTEGER,
			},
			document_number: {
				allowNull: false,
				type: DataTypes.STRING(50),
			},
			first_name: {
				allowNull: false,
				type: DataTypes.STRING(255),
			},
			last_name: {
				allowNull: false,
				type: DataTypes.STRING(255),
			},
			gender: {
				allowNull: true,
				type: DataTypes.INTEGER,
			},
			phone_number: {
				allowNull: true,
				type: DataTypes.STRING(50),
			},
			personal_email: {
				allowNull: true,
				type: DataTypes.STRING(100),
			},
			birth_date: {
				allowNull: true,
				type: DataTypes.DATEONLY,
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
			tableName: 'people',
			appRawName: 'people',
		};
	}

	static override relations(): RelationsReturn {
		return [
			{
				type: 'belongsTo',
				target: 'Genders',
				options: { foreignKey: 'gender', targetKey: 'id', as: '_Genders' },
			},
			{
				inversed: true,
				type: 'hasMany',
				target: 'Genders',
				options: { foreignKey: 'gender', targetKey: 'id', as: '_People' },
			},
		];
	}
}
