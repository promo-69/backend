import CustomerFavoriteGenresModel from '@database/models/main/customer-favorite-genres.model.js';
import { SequelizeRepositoryBase } from '@database/repositories/bases/sequelize.repository.js';

export interface CustomerFavoriteGenre {
	id?: number;
	customer: number;
	genre: number;
	created_at?: Date | string;
}

class CustomerFavoriteGenresRepository extends SequelizeRepositoryBase<CustomerFavoriteGenre, number> {
	constructor() {
		super(CustomerFavoriteGenresModel);
	}
}

export default new CustomerFavoriteGenresRepository();
