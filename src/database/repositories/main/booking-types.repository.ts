import { SequelizeRepositoryBase } from '@repositories/bases/sequelize.repository.js';
import BookingTypesModel from '@database/models/main/booking-types.model.js';

export interface BookingTypesAttributes {
	id?: number;
	description: string;
	deleted_at?: Date;
}

class BookingTypesRepository extends SequelizeRepositoryBase<BookingTypesAttributes, number> {
	constructor() {
		super(BookingTypesModel);
	}
}

export default new BookingTypesRepository();
