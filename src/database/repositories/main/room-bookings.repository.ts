import { SequelizeRepositoryBase } from '@repositories/bases/sequelize.repository.js';
import RoomBookingsModel from '@database/models/main/room-bookings.model.js';

export interface RoomBookingsAttributes {
	id?: number;
	room: number;
	start_time: Date;
	end_time: Date;
	booking_type: number;
	deleted_at?: Date;
}

class RoomBookingsRepository extends SequelizeRepositoryBase<RoomBookingsAttributes, number> {
	constructor() {
		super(RoomBookingsModel);
	}
}

export default new RoomBookingsRepository();
