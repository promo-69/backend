import { SequelizeRepositoryBase } from '@database/repositories/bases/sequelize.repository.js';
import BanksModel from '@database/models/main/banks.model.js';

export interface BanksAttributes {
	id?: number;
	name: string;
	code?: string;
	deleted_at?: Date;
}

class BanksRepository extends SequelizeRepositoryBase<BanksAttributes, number> {
	constructor() {
		super(BanksModel);
	}
}

export default new BanksRepository();
