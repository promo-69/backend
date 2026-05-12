import { DataTypes } from 'sequelize';
import { type RelationsReturn, SequelizeModelBase } from '@database/models/bases/sequelize.model.js';

export default class EmployeesModel extends SequelizeModelBase {
	static definition() {
		return {
			id: {
				primaryKey: true,
				autoIncrement: true,
				allowNull: true,
				type: DataTypes.INTEGER,
			},
			person: {
				allowNull: false,
				type: DataTypes.INTEGER,
			},
			employee_code: {
				allowNull: false,
				type: DataTypes.STRING(50),
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
			tableName: 'employees',
			appRawName: 'employees',
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
				options: { foreignKey: 'person', targetKey: 'id', as: '_Employees' },
			},
		];
	}
}
