import { DataTypes } from 'sequelize';
import { type RelationsReturn, SequelizeModelBase } from '@database/models/bases/sequelize.model.js';

export default class RoomsModel extends SequelizeModelBase {
	static definition() {
		return {
			id: {
				primaryKey: true,
				autoIncrement: true,
				allowNull: true,
				type: DataTypes.INTEGER,
			},
			cinema: {
				allowNull: false,
				type: DataTypes.INTEGER,
			},
			name: {
				allowNull: false,
				type: DataTypes.STRING(100),
			},
			grid_rows: {
				allowNull: false,
				type: DataTypes.INTEGER,
			},
			grid_columns: {
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
			isBasicTable: true,
			schema: 'public',
			tableName: 'rooms',
			appRawName: 'rooms',
			timestamps: false,
		};
	}

	static override relations(): RelationsReturn {
		return [
			{
				type: 'belongsTo',
				target: 'Cinemas',
				options: { foreignKey: 'cinema', targetKey: 'id', as: '_Cinemas' },
			},
			{
				inversed: true,
				type: 'hasMany',
				target: 'Cinemas',
				options: { foreignKey: 'cinema', targetKey: 'id', as: '_Rooms' },
			},
		];
	}
}
