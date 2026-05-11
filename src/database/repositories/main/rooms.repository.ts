import { SequelizeRepositoryBase } from '@repositories/bases/sequelize.repository.js';
import RoomsModel from '@database/models/main/rooms.model.js';

export interface RoomsAttributes {
	id?: number;
	cinema: number;
	name: string;
	grid_rows: number;
	grid_columns: number;
	deleted_at?: Date;
}

export interface RoomFull extends RoomsAttributes {
	_Cinema: { name: string };
	_Status: { description: string };
	_RoomProjectionTypes?: Array<{
		id: number;
		projection_type: number;
		_ProjectionType: { description: string };
	}>;
}

class RoomsRepository extends SequelizeRepositoryBase<RoomsAttributes, number> {
	constructor() {
		super(RoomsModel);
	}

	private get _relations() {
		return [
			{
				association: '_Cinema',
				attributes: ['name'],
				required: true,
			},
			{
				association: '_Status',
				attributes: ['description'],
				required: true,
			},
			{
				association: '_RoomProjectionTypes',
				attributes: ['id', 'projection_type'],
				required: false,
				nested: [
					{
						association: '_ProjectionType',
						attributes: ['description'],
						required: true,
					},
				],
			},
		];
	}

	async getFull(id: number): Promise<RoomFull | null> {
		return this.getOne({ id }, { relations: this._relations }) as Promise<RoomFull | null>;
	}

	async getAllByCinema(cinemaId: number, filters?: any): Promise<{ rows: RoomFull[]; count: number }> {
		return this.getAll(
			{ ...filters, count: true, relations: this._relations },
			{ cinema: cinemaId, status: 1 },
		) as Promise<{ rows: RoomFull[]; count: number }>;
	}

	async getByNameAndCinema(name: string, cinemaId: number): Promise<RoomsAttributes | null> {
		return this.getOne({ name, cinema: cinemaId }) as Promise<RoomsAttributes | null>;
	}
}

export default new RoomsRepository();
