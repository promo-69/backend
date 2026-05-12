import { DataTypes } from 'sequelize';
import { type RelationsReturn, SequelizeModelBase } from '@database/models/bases/sequelize.model.js';

export default class ProjectionTypesModel extends SequelizeModelBase {
	static definition() {
		return {
			id: {
				primaryKey: true,
				autoIncrement: true,
				allowNull: true,
				type: DataTypes.INTEGER,
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
			isBasicTable: true,
			schema: 'public',
			tableName: 'projection_types',
			appRawName: 'projection-types',
		};
	}

	static override relations(): RelationsReturn {
		return [];
	}
}
