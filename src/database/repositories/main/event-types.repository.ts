import { SequelizeRepositoryBase } from '@repositories/bases/sequelize.repository.js';
import EventTypesModel from '@database/models/main/event-types.model.js';

export interface EventTypesAttributes {
	id?: number;
	description: string;
	deleted_at?: Date;
}

class EventTypesRepository extends SequelizeRepositoryBase<EventTypesAttributes, number> {
	constructor() {
		super(EventTypesModel);
	}
}

export default new EventTypesRepository();
