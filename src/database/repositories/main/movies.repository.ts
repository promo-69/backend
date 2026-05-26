import { type RelationConfig, SequelizeRepositoryBase } from '@repositories/bases/sequelize.repository.js';
import MoviesModel from '@database/models/main/movies.model.js';
import { Ops } from '@database/index.js';
import { literal } from 'sequelize';

export interface MoviesAttributes {
	id?: number;
	title: string;
	duration_minutes: number;
	age_classification: number;
	lifecycle_state: number;
	synopsis: string;
	trailer_url?: string;
	poster_url?: string;
	banner_url?: string;
	release_date: Date;
	deleted_at?: Date;
}

export interface MovieFull extends MoviesAttributes {
	_AgeClassification: { description: string };
	_LifecycleState: { description: string };
	_MovieGenres?: Array<{
		id: number;
		genre: number;
		_Genre: { description: string };
	}>;
	_MovieLanguages?: Array<{
		id: number;
		language: number;
		_Language: { description: string };
	}>;
	_MovieProjectionTypes?: Array<{
		id: number;
		projection_type: number;
		_ProjectionType: { description: string };
	}>;
}

class MoviesRepository extends SequelizeRepositoryBase<MoviesAttributes, number> {
	constructor() {
		super(MoviesModel);
	}

	private get _relations(): RelationConfig[] {
		return [
			{
				association: '_AgeClassifications',
				attributes: ['description'],
				required: false,
			},
			{
				association: '_LifecycleStates',
				attributes: ['description'],
				required: false,
			},
			{
				association: '_MovieGenres',
				attributes: ['id', 'genre'],
				required: false,
				separate: true,
				nested: [
					{
						association: '_Genres',
						attributes: ['description'],
						required: true,
					},
				],
			},
			{
				association: '_MovieLanguages',
				attributes: ['id', 'language'],
				required: false,
				separate: true,
				nested: [
					{
						association: '_Languages',
						attributes: ['description'],
						required: true,
					},
				],
			},
			{
				association: '_MovieProjectionTypes',
				attributes: ['id', 'projection_type'],
				required: false,
				separate: true,
				nested: [
					{
						association: '_ProjectionTypes',
						attributes: ['description'],
						required: true,
					},
				],
			},
		];
	}

	private readonly _aliasMap: Record<string, string> = {
		_AgeClassifications: 'age_classification',
		_LifecycleStates: 'lifecycle_state',
		_MovieGenres: 'genres',
		_MovieLanguages: 'languages',
		_MovieProjectionTypes: 'projection_types',
		_Showtimes: 'showtimes',
	};

	private parseResponse<R>(data: R | null): R | null {
		if (!data) return null;

		if (Array.isArray(data)) return data.map((item) => this.parseResponse(item)) as unknown as R;

		if (typeof data === 'object' && data !== null) {
			const parsed = { ...data } as Record<string, unknown>;

			for (const key of Object.keys(parsed)) {
				if (this._aliasMap[key]) {
					const newKey = this._aliasMap[key];
					parsed[newKey] = parsed[key];
					delete parsed[key];
				}
			}

			return parsed as unknown as R;
		}

		return data;
	}

	async getFull(id: number): Promise<MovieFull | null> {
		const result = await this.getOne({ id }, { relations: this._relations });
		return this.parseResponse(result) as MovieFull | null;
	}

	async getAllFull(filters?: any): Promise<{ rows: MovieFull[]; count: number }> {
		const result = (await this.getAll({ ...filters, count: true, relations: this._relations })) as {
			rows: any[];
			count: number;
		};
		return {
			count: result.count,
			rows: this.parseResponse(result.rows) as MovieFull[],
		};
	}

	async getByTitle(title: string): Promise<MoviesAttributes | null> {
		const result = await this.getOne({ title });
		return this.parseResponse(result) as MoviesAttributes | null;
	}

	async getWithShowtimes(filters?: any): Promise<{ rows: MovieFull[]; count: number }> {
		const activeMovieIdsLiteral = literal(
			`(SELECT DISTINCT "movie" FROM "showtimes" s INNER JOIN "room_bookings" rb ON s."booking" = rb."id" WHERE rb."start_time" > NOW())`,
		);

		const result = (await this.getAll(
			{
				...filters,
				count: true,
				relations: [
					...this._relations,
					{
						association: '_Showtimes',
						separate: true,
						nested: [
							{
								association: '_RoomBookings',
								required: true,
							},
						],
					},
				],
			},
			{
				id: { [Ops.in]: activeMovieIdsLiteral },
			},
		)) as { rows: any[]; count: number };

		return {
			count: result.count,
			rows: this.parseResponse(result.rows) as MovieFull[],
		};
	}
}

export default new MoviesRepository();
