import { SequelizeRepositoryBase } from '@repositories/bases/sequelize.repository.js';
import TaxesModel from '@database/models/main/taxes.model.js';

export interface TaxesAttributes {
	id?: number;
	name: string;
	rate: number;
	is_percentage?: boolean;
	deleted_at?: Date;
}

class TaxesRepository extends SequelizeRepositoryBase<TaxesAttributes, number> {
	constructor() {
		super(TaxesModel);
	}
}

export default new TaxesRepository();
