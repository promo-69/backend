import { DataTypes } from 'sequelize';
import { type RelationsReturn, SequelizeModelBase } from '@database/models/bases/sequelize.model.js';

export default class InvoiceSequencesModel extends SequelizeModelBase {
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
			prefix: {
				allowNull: false,
				type: DataTypes.STRING(10),
			},
			current_value: {
				allowNull: false,
				type: DataTypes.INTEGER,
				defaultValue: 0,
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
			tableName: 'invoice_sequences',
			appRawName: 'invoice-sequences',
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
				options: { foreignKey: 'cinema', targetKey: 'id', as: '_InvoiceSequences' },
			},
		];
	}
}
