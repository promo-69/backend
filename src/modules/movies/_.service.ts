import { BaseService } from '@bases/service.base.js';
import { Database } from '@database/index.js';
import { ConflictError, NotFoundError, ValidationError } from '@errors';
import { type ProcessedQueryFilters } from '@rules/api-query.type.js';
import { type Transaction } from 'sequelize';

interface CreateMovieBody {
	title: string;
	durationMinutes: number;
	ageClassification: number;
	lifecycleState: number;
	synopsis: string;
	posterUrl?: string;
	bannerUrl?: string;
	trailerUrl?: string;
	releaseDate: string;
	genres: number[];
}

interface UpdateMovieBody {
	lifecycleState?: number;
	synopsis?: string;
	posterUrl?: string;
	bannerUrl?: string;
	trailerUrl?: string;
	genres?: number[];
}

export class MoviesService extends BaseService {
	constructor() {
		super();
	}

	private get _movies() {
		return Database.repository('main', 'movies') as any;
	}
	private get _movieGenres() {
		return Database.repository('main', 'movie-genres') as any;
	}
	private get _genres() {
		return Database.repository('main', 'genres') as any;
	}
	private get _ageClassifications() {
		return Database.repository('main', 'age-classifications') as any;
	}

	// --- HU-APP-WEB-06: Cartelera pública ---
	async getBillboard(filters?: ProcessedQueryFilters) {
		return this._movies.getAllOnBillboard(filters);
	}

	// --- HU-APP-WEB-07: Detalle público de película ---
	async getMovieDetail(id: number) {
		const movie = await this._movies.getFull(id);
		if (!movie) throw new NotFoundError('Película no encontrada');
		return movie;
	}

	// --- HU-OPERATIVA-12/13: Registrar película ---
	async createMovie(body: CreateMovieBody) {
		const {
			title,
			durationMinutes,
			ageClassification,
			lifecycleState,
			synopsis,
			posterUrl,
			bannerUrl,
			trailerUrl,
			releaseDate,
			genres,
		} = body;

		this.validateRequired(
			{ title, durationMinutes, ageClassification, lifecycleState, synopsis, releaseDate } as any,
			['title', 'durationMinutes', 'ageClassification', 'lifecycleState', 'synopsis', 'releaseDate'],
		);

		if (!Array.isArray(genres) || genres.length === 0)
			throw new ValidationError('Debe especificar al menos un género', ['genres']);

		if (!Number.isInteger(durationMinutes) || durationMinutes <= 0)
			throw new ValidationError('La duración debe ser un entero mayor a 0', ['durationMinutes']);

		// Verificar título único
		const existing = await this._movies.getByTitle(title);
		if (existing) throw new ConflictError('Ya existe una película con ese título', 'MOVIE_TITLE_DUPLICATE');

		// Verificar que ageClassification exista
		const ageClass = await this._ageClassifications.getById(ageClassification);
		if (!ageClass) throw new ValidationError('La clasificación de edad indicada no existe', ['ageClassification']);

		// Verificar que todos los géneros existan
		for (const genreId of genres) {
			const genre = await this._genres.getById(genreId);
			if (!genre) throw new ValidationError(`El género con ID ${genreId} no existe en el catálogo`, ['genres']);
		}

		const createdMovie = await this._movies.transaction(async (transaction: Transaction) => {
			const movie = await this._movies.create(
				{
					title,
					duration_minutes: durationMinutes,
					age_classification: ageClassification,
					lifecycle_state: lifecycleState,
					synopsis,
					poster_url: posterUrl ?? null,
					banner_url: bannerUrl ?? null,
					trailer_url: trailerUrl ?? null,
					release_date: releaseDate,
				},
				{ transaction },
			);

			const genreRecords = genres.map((gId: number) => ({
				movie: movie.id,
				genre: gId,
			}));
			await this._movieGenres.bulkCreate(genreRecords, { transaction });

			return movie;
		});

		return { movie_id: createdMovie.id, title: createdMovie.title };
	}

	// --- HU-OPERATIVA-13 (Edición): Editar película ---
	async updateMovie(id: number, body: UpdateMovieBody) {
		const movie = await this._movies.getFull(id);
		if (!movie) throw new NotFoundError('Película no encontrada');

		const { genres, lifecycleState, synopsis, posterUrl, bannerUrl, trailerUrl } = body;
		const updateData: Record<string, any> = {};

		if (lifecycleState !== undefined) updateData.lifecycle_state = lifecycleState;
		if (synopsis !== undefined) updateData.synopsis = synopsis;
		if (posterUrl !== undefined) updateData.poster_url = posterUrl;
		if (bannerUrl !== undefined) updateData.banner_url = bannerUrl;
		if (trailerUrl !== undefined) updateData.trailer_url = trailerUrl;

		if (Object.keys(updateData).length === 0 && genres === undefined)
			throw new ValidationError('No se proporcionaron datos para actualizar', []);

		await this._movies.transaction(async (transaction: Transaction) => {
			if (Object.keys(updateData).length > 0) await this._movies.update(id, updateData, { transaction });

			if (genres !== undefined) {
				await this._movieGenres.deleteByMovie(id, { transaction });
				if (genres.length > 0) {
					const records = genres.map((gId: number) => ({
						movie: id,
						genre: gId,
					}));
					await this._movieGenres.bulkCreate(records, { transaction });
				}
			}
		});

		return null;
	}

	// --- HU-OPERATIVA-13 (Desactivación): Soft delete ---
	async deleteMovie(id: number) {
		const movie = await this._movies.getFull(id);
		if (!movie) throw new NotFoundError('Película no encontrada');

		let activeShowtimes = 0;
		try {
			activeShowtimes = await Database.repository('main', 'showtimes').count({ movie: id } as any);
		} catch {
			/* módulo showtimes aún no implementado */
		}

		if (activeShowtimes > 0)
			throw new ConflictError(
				'No se puede retirar la película porque tiene funciones futuras activas.',
				'MOVIE_HAS_ACTIVE_SHOWTIMES',
			);

		await this._movies.delete(id);
		return null;
	}
}

export default new MoviesService();
