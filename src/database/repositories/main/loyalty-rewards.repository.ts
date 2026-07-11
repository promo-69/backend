import { SequelizeRepositoryBase } from '@repositories/bases/sequelize.repository.js';
import LoyaltyRewardsModel from '@database/models/main/loyalty-rewards.model.js';

export interface LoyaltyRewardsAttributes {
	id?: number;
	name: string;
	description?: string | null;
	image_url?: string | null;
	points_cost: number;
	required_loyalty_level: number;
	cinema: number;
	reward_type: string;
	product?: number | null;
	combo?: number | null;
	quantity?: number;
	start_date?: Date | string | null;
	end_date?: Date | string | null;
	is_active?: boolean;
	created_at?: Date;
	updated_at?: Date;
	deleted_at?: Date;
}

class LoyaltyRewardsRepository extends SequelizeRepositoryBase<LoyaltyRewardsAttributes, number> {
	constructor() {
		super(LoyaltyRewardsModel);
	}
}

export default new LoyaltyRewardsRepository();
