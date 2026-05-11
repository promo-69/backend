import { SequelizeRepositoryBase } from '@repositories/bases/sequelize.repository.js';
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
	_Status: { description: string };
	_MovieGenres?: Array<{
		id: number;
		genre: number;
		_Genre: { description: string };
	}>;
}

class MoviesRepository extends SequelizeRepositoryBase<MoviesAttributes, number> {
	constructor() {
		super(MoviesModel);
	}

	private get _relations() {
		return [
			{
				association: '_AgeClassification',
				attributes: ['description'],
				required: true,
			},
			{
				association: '_LifecycleState',
				attributes: ['description'],
				required: true,
			},
			{
				association: '_Status',
				attributes: ['description'],
				required: true,
			},
			{
				association: '_MovieGenres',
				attributes: ['id', 'genre'],
				required: false,
				nested: [
					{
						association: '_Genre',
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

	async getAllOnBillboard(filters?: any): Promise<{ rows: MovieFull[]; count: number }> {
		return this.getAll({ ...filters, count: true, relations: this._relations }, { status: 1 }) as Promise<{
			rows: MovieFull[];
			count: number;
		}>;
	}

	async getByTitle(title: string): Promise<MoviesAttributes | null> {
		return this.getOne({ title }) as Promise<MoviesAttributes | null>;
	}
}

export default new MoviesRepository();
