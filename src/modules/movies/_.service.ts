import { BaseService } from '@bases/service.base.js';
import { Database } from '@database/index.js';
import { ConflictError, NotFoundError, ValidationError } from '@errors';
import { movieImagesService } from '@services/movie-images.service.js';
import { type ProcessedQueryFilters } from '@rules/api-query.type.js';
import { type Transaction } from 'sequelize';

interface CreateMovieBody {
	title: string;
	durationMinutes: number | string;
	ageClassification: number | string;
	lifecycleState: number | string;
	synopsis: string;
	posterUrl?: string;
	bannerUrl?: string;
	trailerUrl?: string;
	releaseDate: string;
	genres: number[] | string;
}

interface UpdateMovieBody {
	lifecycleState?: number | string;
	synopsis?: string;
	posterUrl?: string;
	bannerUrl?: string;
	trailerUrl?: string;
	genres?: number[] | string;
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
	async createMovie(
		body: CreateMovieBody,
		rawFiles?: Express.Multer.File[] | { [fieldname: string]: Express.Multer.File[] },
	) {
		const { title, synopsis, releaseDate, trailerUrl } = body;

		// Casteo explícito: multipart/form-data envía todo como string
		const durationMinutes = Number(body.durationMinutes);
		const ageClassification = Number(body.ageClassification);
		const lifecycleState = Number(body.lifecycleState);

		// genres puede llegar como string JSON desde multipart
		const genres: number[] = typeof body.genres === 'string' ? JSON.parse(body.genres) : (body.genres as number[]);

		// 1. Validaciones de campos requeridos
		this.validateRequired(
			{ title, durationMinutes, ageClassification, lifecycleState, synopsis, releaseDate } as any,
			['title', 'durationMinutes', 'ageClassification', 'lifecycleState', 'synopsis', 'releaseDate'],
		);

		if (!Array.isArray(genres) || genres.length === 0)
			throw new ValidationError('Debe especificar al menos un género', ['genres']);

		if (!Number.isInteger(durationMinutes) || durationMinutes <= 0)
			throw new ValidationError('La duración debe ser un entero mayor a 0', ['durationMinutes']);

		// Validar formato de URL del tráiler antes de tocar ImageKit
		movieImagesService.validateTrailerUrl(trailerUrl);

		// 2. Verificar unicidad del título
		const existing = await this._movies.getByTitle(title);
		if (existing) throw new ConflictError('Ya existe una película con ese título', 'MOVIE_TITLE_DUPLICATE');

		// 3. Verificar que ageClassification exista
		const ageClass = await this._ageClassifications.getById(ageClassification);
		if (!ageClass) throw new ValidationError('La clasificación de edad indicada no existe', ['ageClassification']);

		// 4. Verificar que todos los géneros existan
		for (const genreId of genres) {
			const genre = await this._genres.getById(genreId);
			if (!genre) throw new ValidationError(`El género con ID ${genreId} no existe en el catálogo`, ['genres']);
		}

		// 5. Solo subir imágenes DESPUÉS de que todas las validaciones pasen
		const imageFiles = movieImagesService.extractFromRequest(rawFiles);
		const { posterUrl, bannerUrl, posterFileId, bannerFileId } =
			await movieImagesService.uploadMovieImages(imageFiles);

		// 6. Persistir con rollback de imágenes si falla la transacción
		try {
			const createdMovie = await this._movies.transaction(async (transaction: Transaction) => {
				const movie = await this._movies.create(
					{
						title,
						duration_minutes: durationMinutes,
						age_classification: ageClassification,
						lifecycle_state: lifecycleState,
						synopsis,
						poster_url: posterUrl ?? body.posterUrl ?? null,
						banner_url: bannerUrl ?? body.bannerUrl ?? null,
						trailer_url: trailerUrl ?? null,
						release_date: releaseDate,
					},
					{ transaction },
				);

				const genreRecords = genres.map((gId: number) => ({
					movie: movie.id,
					genre: gId,
					status: 1,
				}));

				await this._movieGenres.bulkCreate(genreRecords, { transaction });

				return movie;
			});

			return createdMovie;
		} catch (error) {
			await movieImagesService.rollbackUploadedImages([posterFileId, bannerFileId]);
			throw error;
		}
	}

	// --- HU-OPERATIVA-13 (Edición): Editar película ---
	async updateMovie(
		id: number,
		body: UpdateMovieBody,
		rawFiles?: Express.Multer.File[] | { [fieldname: string]: Express.Multer.File[] },
	) {
		const movie = await this._movies.getFull(id);
		if (!movie) throw new NotFoundError('Película no encontrada');

		const { synopsis, trailerUrl } = body;

		// Casteo de campos numéricos que pueden venir como string por multipart
		const lifecycleState = body.lifecycleState !== undefined ? Number(body.lifecycleState) : undefined;

		// genres puede llegar como string JSON desde multipart
		const genres: number[] | undefined =
			body.genres === undefined
				? undefined
				: typeof body.genres === 'string'
					? JSON.parse(body.genres)
					: (body.genres as number[]);

		// Validar trailer URL antes de procesar imágenes
		movieImagesService.validateTrailerUrl(trailerUrl);

		const updateData: Record<string, any> = {};
		if (lifecycleState !== undefined) updateData.lifecycle_state = lifecycleState;
		if (synopsis !== undefined) updateData.synopsis = synopsis;
		if (trailerUrl !== undefined) updateData.trailer_url = trailerUrl;

		if (Object.keys(updateData).length === 0 && genres === undefined && !rawFiles)
			throw new ValidationError('No se proporcionaron datos para actualizar', []);

		// Validar géneros ANTES de subir imágenes
		if (genres !== undefined) {
			for (const genreId of genres) {
				const genre = await this._genres.getById(genreId);
				if (!genre) throw new ValidationError(`El género con ID ${genreId} no existe`, ['genres']);
			}
		}

		// Subir imágenes solo si se enviaron archivos y las validaciones básicas pasaron
		const imageFiles = movieImagesService.extractFromRequest(rawFiles);
		const { posterUrl, bannerUrl, posterFileId, bannerFileId } =
			await movieImagesService.uploadMovieImages(imageFiles);

		if (posterUrl) updateData.poster_url = posterUrl;
		if (bannerUrl) updateData.banner_url = bannerUrl;

		// Transacción con rollback de imágenes si algo falla
		try {
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
		} catch (error) {
			await movieImagesService.rollbackUploadedImages([posterFileId, bannerFileId]);
			throw error;
		}

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
