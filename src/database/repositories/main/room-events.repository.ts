import { SequelizeRepositoryBase } from '@repositories/bases/sequelize.repository.js';
import RoomEventsModel from '@database/models/main/room-events.model.js';

export interface RoomEventsAttributes {
	id?: number;
	booking: number;
	event_type: number;
	name: string;
	organizer?: string;
	description?: string;
	currency: number;
	price: number;
	deleted_at?: Date;
}

class RoomEventsRepository extends SequelizeRepositoryBase<RoomEventsAttributes, number> {
	constructor() {
		super(RoomEventsModel);
	}
}

export default new RoomEventsRepository();
