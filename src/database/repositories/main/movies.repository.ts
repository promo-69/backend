import { type RelationConfig, SequelizeRepositoryBase } from '@repositories/bases/sequelize.repository.js';
import MoviesModel from '@database/models/main/movies.model.js';

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
				attributes: [['description', 'desc']],
				required: false,
			},
			{
				association: '_LifecycleStates',
				attributes: [['description', 'desc']],
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
						attributes: [['description', 'desc']],
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

	async getFull(id: number): Promise<MovieFull | null> {
		return this.getOne({ id }, { relations: this._relations }) as Promise<MovieFull | null>;
	}

	async getAllFull(filters?: any): Promise<{ rows: MovieFull[]; count: number }> {
		return this.getAll({ ...filters, count: true, relations: this._relations }) as Promise<{
			rows: MovieFull[];
			count: number;
		}>;
	}

	async getByTitle(title: string): Promise<MoviesAttributes | null> {
		return this.getOne({ title }) as Promise<MoviesAttributes | null>;
	}
}

export default new MoviesRepository();
