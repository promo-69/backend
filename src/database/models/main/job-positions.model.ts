import { DataTypes } from 'sequelize';
import { type RelationsReturn, SequelizeModelBase } from '@database/models/bases/sequelize.model.js';

export default class JobPositionsModel extends SequelizeModelBase {
	static definition() {
		return {
			id: {
				primaryKey: true,
				autoIncrement: true,
				allowNull: false,
				type: DataTypes.INTEGER,
			},
			title: {
				allowNull: false,
				type: DataTypes.STRING(255),
			},
			description: {
				allowNull: true,
				type: DataTypes.STRING(255),
			},
			is_pensionable: {
				allowNull: false,
				type: DataTypes.BOOLEAN,
				defaultValue: false,
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
			tableName: 'job_positions',
			appRawName: 'job-positions',
		};
	}

	static override relations(): RelationsReturn {
		return [];
	}
}
