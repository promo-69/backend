import { DataTypes } from 'sequelize';
import { type RelationsReturn, SequelizeModelBase } from '@database/models/bases/sequelize.model.js';

export default class CinemasModel extends SequelizeModelBase {
	static definition() {
		return {
			id: {
				primaryKey: true,
				autoIncrement: true,
				allowNull: true,
				type: DataTypes.INTEGER,
			},
			name: {
				allowNull: false,
				type: DataTypes.STRING(255),
			},
			address: {
				allowNull: true,
				type: DataTypes.TEXT,
			},
			phone: {
				allowNull: true,
				type: DataTypes.STRING(50),
			},
			opening_time: {
				allowNull: false,
				type: DataTypes.TIME,
			},
			closing_time: {
				allowNull: false,
				type: DataTypes.TIME,
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
			tableName: 'cinemas',
			appRawName: 'cinemas',
		};
	}

	static override relations(): RelationsReturn {
		return [];
	}
}
