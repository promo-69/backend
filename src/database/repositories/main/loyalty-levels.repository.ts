import { SequelizeRepositoryBase } from '@repositories/bases/sequelize.repository.js';
import LoyaltyLevelsModel from '@database/models/main/loyalty-levels.model.js';

export interface LoyaltyLevelsAttributes {
	id?: number;
	name: string;
	required_points?: number;
	deleted_at?: Date;
}

class LoyaltyLevelsRepository extends SequelizeRepositoryBase<LoyaltyLevelsAttributes, number> {
	constructor() {
		super(LoyaltyLevelsModel);
	}
}

export default new LoyaltyLevelsRepository();
