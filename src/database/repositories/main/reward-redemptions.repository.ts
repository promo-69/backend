import { SequelizeRepositoryBase } from '@repositories/bases/sequelize.repository.js';
import RewardRedemptionsModel from '@database/models/main/reward-redemptions.model.js';

export interface RewardRedemptionsAttributes {
	id?: number;
	reward: number;
	customer: number;
	order: number;
	points_spent: number;
	redeemed_at?: Date;
	created_at?: Date;
	deleted_at?: Date;
}

class RewardRedemptionsRepository extends SequelizeRepositoryBase<RewardRedemptionsAttributes, number> {
	constructor() {
		super(RewardRedemptionsModel);
	}
}

export default new RewardRedemptionsRepository();
