import { BaseService } from '@bases/service.base.js';
import { Database } from '@database/index.js';
import { ConflictError, NotFoundError, ValidationError } from '@errors';
import { movieImagesService } from '@services/movie-images.service.js';
import { imageStorageService } from '@services/image-storage.service.js';
import { Logger } from '@utils/logger.util.js';
import { type ProcessedQueryFilters } from '@rules/api-query.type.js';
import { Op, type Transaction } from 'sequelize';

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

	async getBillboard(filters?: ProcessedQueryFilters) {
		return this._movies.getAllOnBillboard(filters);
	}

	async getMovieDetail(id: number) {
		if (!Number.isInteger(id) || id <= 0) throw new ValidationError('ID de película inválido', ['id']);

		const movie = await this._movies.getFull(id);
		if (!movie) throw new NotFoundError('Película no encontrada');
		return movie;
	}

	async createMovie(
		body: CreateMovieBody,
		rawFiles?: Express.Multer.File[] | { [fieldname: string]: Express.Multer.File[] },
	) {
		const { title, synopsis, releaseDate, trailerUrl } = body;

		const durationMinutes = Number(body.durationMinutes);
		const ageClassification = Number(body.ageClassification);
		const lifecycleState = Number(body.lifecycleState);

		let genres: number[];
		if (typeof body.genres === 'string') {
			try {
				genres = JSON.parse(body.genres);
			} catch {
				throw new ValidationError('El campo genres debe ser un JSON válido', ['genres']);
			}
		} else {
			genres = body.genres as number[];
		}

		this.validateRequired(
			{ title, durationMinutes, ageClassification, lifecycleState, synopsis, releaseDate } as any,
			['title', 'durationMinutes', 'ageClassification', 'lifecycleState', 'synopsis', 'releaseDate'],
		);

		if (Number.isNaN(Date.parse(releaseDate)))
			throw new ValidationError('La fecha de estreno no es válida', ['releaseDate']);

		if (!Array.isArray(genres) || genres.length === 0)
			throw new ValidationError('Debe especificar al menos un género', ['genres']);

		if (!Number.isInteger(durationMinutes) || durationMinutes <= 0)
			throw new ValidationError('La duración debe ser un entero mayor a 0', ['durationMinutes']);

		movieImagesService.validateTrailerUrl(trailerUrl);

		const existing = await this._movies.getByTitle(title);
		if (existing) throw new ConflictError('Ya existe una película con ese título', 'MOVIE_TITLE_DUPLICATE');

		const ageClass = await this._ageClassifications.getById(ageClassification);
		if (!ageClass) throw new ValidationError('La clasificación de edad indicada no existe', ['ageClassification']);

		for (const genreId of genres) {
			const genre = await this._genres.getById(genreId);
			if (!genre) throw new ValidationError(`El género con ID ${genreId} no existe en el catálogo`, ['genres']);
		}

		const imageFiles = movieImagesService.extractFromRequest(rawFiles);
		const { posterUrl, bannerUrl, posterFileId, bannerFileId } =
			await movieImagesService.uploadMovieImages(imageFiles);

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

			return { movie_id: createdMovie.id, title: createdMovie.title };
		} catch (error) {
			await movieImagesService.rollbackUploadedImages([posterFileId, bannerFileId]);
			throw error;
		}
	}

	async updateMovie(
		id: number,
		body: UpdateMovieBody,
		rawFiles?: Express.Multer.File[] | { [fieldname: string]: Express.Multer.File[] },
	) {
		if (!Number.isInteger(id) || id <= 0) throw new ValidationError('ID de película inválido', ['id']);

		const movie = await this._movies.getFull(id);
		if (!movie) throw new NotFoundError('Película no encontrada');

		const previousPosterUrl: string | null = movie.poster_url ?? null;
		const previousBannerUrl: string | null = movie.banner_url ?? null;

		const { synopsis, trailerUrl, posterUrl: bodyPosterUrl, bannerUrl: bodyBannerUrl } = body;
		const lifecycleState = body.lifecycleState !== undefined ? Number(body.lifecycleState) : undefined;

		let genres: number[] | undefined;
		if (body.genres === undefined) {
			genres = undefined;
		} else if (typeof body.genres === 'string') {
			try {
				genres = JSON.parse(body.genres);
			} catch {
				throw new ValidationError('El campo genres debe ser un JSON válido', ['genres']);
			}
		} else {
			genres = body.genres as number[];
		}

		movieImagesService.validateTrailerUrl(trailerUrl);

		const updateData: Record<string, any> = {};
		if (lifecycleState !== undefined) updateData.lifecycle_state = lifecycleState;
		if (synopsis !== undefined) updateData.synopsis = synopsis;
		if (trailerUrl !== undefined) updateData.trailer_url = trailerUrl;

		const hasRemoteImageUpdate = bodyPosterUrl !== undefined || bodyBannerUrl !== undefined;
		if (Object.keys(updateData).length === 0 && genres === undefined && !rawFiles && !hasRemoteImageUpdate)
			throw new ValidationError('No se proporcionaron datos para actualizar', []);

		if (genres !== undefined) {
			for (const genreId of genres) {
				const genre = await this._genres.getById(genreId);
				if (!genre) throw new ValidationError(`El género con ID ${genreId} no existe`, ['genres']);
			}
		}

		const imageFiles = movieImagesService.extractFromRequest(rawFiles);
		const { posterUrl, bannerUrl, posterFileId, bannerFileId } =
			await movieImagesService.uploadMovieImages(imageFiles);

		if (posterUrl) updateData.poster_url = posterUrl;
		else if (bodyPosterUrl !== undefined) updateData.poster_url = bodyPosterUrl;

		if (bannerUrl) updateData.banner_url = bannerUrl;
		else if (bodyBannerUrl !== undefined) updateData.banner_url = bodyBannerUrl;

		try {
			await this._movies.transaction(async (transaction: Transaction) => {
				if (Object.keys(updateData).length > 0) await this._movies.update(id, updateData, { transaction });

				if (genres !== undefined) {
					await this._movieGenres.deleteByMovie(id, { transaction });
					if (genres.length > 0) {
						const records = genres.map((gId: number) => ({ movie: id, genre: gId }));
						await this._movieGenres.bulkCreate(records, { transaction });
					}
				}
			});
		} catch (error) {
			await movieImagesService.rollbackUploadedImages([posterFileId, bannerFileId]);
			throw error;
		}

		if (posterUrl && previousPosterUrl) {
			imageStorageService
				.deleteImageByUrl(previousPosterUrl)
				.catch((err) => Logger.error('updateMovie: failed to delete old poster', err));
		}
		if (bannerUrl && previousBannerUrl) {
			imageStorageService
				.deleteImageByUrl(previousBannerUrl)
				.catch((err) => Logger.error('updateMovie: failed to delete old banner', err));
		}

		return this._movies.getFull(id);
	}

	async deleteMovie(id: number) {
		if (!Number.isInteger(id) || id <= 0) throw new ValidationError('ID de película inválido', ['id']);

		const movie = await this._movies.getFull(id);
		if (!movie) throw new NotFoundError('Película no encontrada');

		let activeShowtimes = 0;
		try {
			activeShowtimes = await Database.repository('main', 'showtimes').count({
				movie: id,
				start_time: { [Op.gt]: new Date() },
			} as any);
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
