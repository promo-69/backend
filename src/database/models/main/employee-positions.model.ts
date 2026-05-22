import { DataTypes } from 'sequelize';
import { type RelationsReturn, SequelizeModelBase } from '@database/models/bases/sequelize.model.js';

export default class EmployeePositionsModel extends SequelizeModelBase {
	static definition() {
		return {
			id: {
				primaryKey: true,
				autoIncrement: true,
				allowNull: false,
				type: DataTypes.INTEGER,
			},
			employee: {
				allowNull: false,
				type: DataTypes.INTEGER,
			},
			job_position: {
				allowNull: false,
				type: DataTypes.INTEGER,
			},
			cinema: {
				allowNull: false,
				type: DataTypes.INTEGER,
			},
			start_date: {
				allowNull: false,
				type: DataTypes.DATEONLY,
			},
			end_date: {
				allowNull: true,
				type: DataTypes.DATEONLY,
			},
			salary_base: {
				allowNull: true,
				type: DataTypes.DECIMAL(10, 2),
			},
			deleted_at: {
				allowNull: true,
				type: DataTypes.DATE,
			}
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
			tableName: 'employee_positions',
			appRawName: 'employee-positions',
		};
	}

	static override relations(): RelationsReturn {
		return [
			{
				type: 'belongsTo',
				target: 'Employees',
				options: { foreignKey: 'employee', targetKey: 'id', as: '_Employees' },
			},
			{
				inversed: true,
				type: 'hasMany',
				target: 'Employees',
				options: { foreignKey: 'employee', targetKey: 'id', as: '_EmployeePositions' },
			},
			{
				type: 'belongsTo',
				target: 'JobPositions',
				options: { foreignKey: 'job_position', targetKey: 'id', as: '_JobPositions' },
			},
			{
				inversed: true,
				type: 'hasMany',
				target: 'JobPositions',
				options: { foreignKey: 'job_position', targetKey: 'id', as: '_EmployeePositions' },
			},
			{
				type: 'belongsTo',
				target: 'Cinemas',
				options: { foreignKey: 'cinema', targetKey: 'id', as: '_Cinemas' },
			},
			{
				inversed: true,
				type: 'hasMany',
				target: 'Cinemas',
				options: { foreignKey: 'cinema', targetKey: 'id', as: '_EmployeePositions' },
			},
		];
	}
}
