import { DataTypes } from 'sequelize';
import { type RelationsReturn, SequelizeModelBase } from '@database/models/bases/sequelize.model.js';

export default class TaxesModel extends SequelizeModelBase {
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
				type: DataTypes.STRING(100),
			},
			rate: {
				allowNull: false,
				type: DataTypes.DECIMAL(10, 2),
			},
			is_percentage: {
				allowNull: false,
				type: DataTypes.BOOLEAN,
				defaultValue: true,
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
			tableName: 'taxes',
			appRawName: 'taxes',
			timestamps: false,
		};
	}

	static override relations(): RelationsReturn {
		return [];
	}
}
