import { SequelizeRepositoryBase } from '@repositories/bases/sequelize.repository.js';
import InvoiceSequencesModel from '@database/models/main/invoice-sequences.model.js';

export interface InvoiceSequencesAttributes {
	id?: number;
	cinema: number;
	prefix: string;
	current_value?: number;
	deleted_at?: Date;
}

class InvoiceSequencesRepository extends SequelizeRepositoryBase<InvoiceSequencesAttributes, number> {
	constructor() {
		super(InvoiceSequencesModel);
	}
}

export default new InvoiceSequencesRepository();
