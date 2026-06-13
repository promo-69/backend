import { BaseService } from '@bases/service.base.js';
import { Database } from '@database/index.js';
import { ConflictError, NotFoundError, ValidationError } from '@errors';
import { movieImagesService } from '@services/movie-images.service.js';
import { imageStorageService } from '@services/image-storage.service.js';
import { Logger } from '@utils/logger.util.js';
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
    languages: number[] | string;
    projectionTypes: number[] | string;
}

interface UpdateMovieBody {
    lifecycleState?: number | string;
    synopsis?: string;
    posterUrl?: string;
    bannerUrl?: string;
    trailerUrl?: string;
    genres?: number[] | string;
    languages?: number[] | string;
    projectionTypes?: number[] | string;
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
    private get _movieLanguages() {
        return Database.repository('main', 'movie-languages') as any;
    }
    private get _languages() {
        return Database.repository('main', 'languages') as any;
    }
    private get _movieProjectionTypes() {
        return Database.repository('main', 'movie-projection-types') as any;
    }
    private get _projectionTypes() {
        return Database.repository('main', 'projection-types') as any;
    }
    private get _ageClassifications() {
        return Database.repository('main', 'age-classifications') as any;
    }

    async getMovies(filters?: ProcessedQueryFilters) {
        return this._movies.getAllFull(filters);
    }

    async getMoviesWithShowtimes(filters?: ProcessedQueryFilters) {
        return this._movies.getWithShowtimes(filters);
    }

    async getUpcoming(filters?: ProcessedQueryFilters) {
        return this._movies.getUpcoming(filters);
    }

    async getByLifecycle(lifecycleState: number, filters?: ProcessedQueryFilters) {
        const lifecycleRecord = await Database.repository('main', 'movie-lifecycle-states').getOne({
            id: lifecycleState,
        } as any);
        if (!lifecycleRecord)
            throw new ValidationError(`Estado de ciclo de vida ${lifecycleState} no existe`, ['lifecycleState']);

        const all = await this._movies.getAllFull(filters);
        const filtered = all.rows.filter(
            (m: any) => m.lifecycle_state?.description === (lifecycleRecord as any).description,
        );
        return { ...all, rows: filtered, count: filtered.length };
    }

    async getMovieDetail(id: number) {
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
        const genres: number[] = typeof body.genres === 'string' ? JSON.parse(body.genres) : (body.genres as number[]);
        const languages: number[] =
            typeof body.languages === 'string' ? JSON.parse(body.languages) : (body.languages as number[]);
        const projectionTypes: number[] =
            typeof body.projectionTypes === 'string'
                ? JSON.parse(body.projectionTypes)
                : (body.projectionTypes as number[]);

        this.validateRequired(
            { title, durationMinutes, ageClassification, lifecycleState, synopsis, releaseDate } as any,
            ['title', 'durationMinutes', 'ageClassification', 'lifecycleState', 'synopsis', 'releaseDate'],
        );

        if (!Array.isArray(genres) || genres.length === 0)
            throw new ValidationError('Debe especificar al menos un género', ['genres']);
        if (!Array.isArray(languages) || languages.length === 0)
            throw new ValidationError('Debe especificar al menos un idioma', ['languages']);
        if (!Array.isArray(projectionTypes) || projectionTypes.length === 0)
            throw new ValidationError('Debe especificar al menos un formato de proyección', ['projectionTypes']);

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
        for (const languageId of languages) {
            const language = await this._languages.getById(languageId);
            if (!language)
                throw new ValidationError(`El idioma con ID ${languageId} no existe en el catálogo`, ['languages']);
        }
        for (const projectionId of projectionTypes) {
            const projectionType = await this._projectionTypes.getById(projectionId);
            if (!projectionType)
                throw new ValidationError(`El formato de proyección con ID ${projectionId} no existe en el catálogo`, [
                    'projectionTypes',
                ]);
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
                const languageRecords = languages.map((lId: number) => ({
                    movie: movie.id,
                    language: lId,
                }));
                const projectionRecords = projectionTypes.map((pId: number) => ({
                    movie: movie.id,
                    projection_type: pId,
                }));

                await this._movieGenres.bulkCreate(genreRecords, { transaction });
                await this._movieLanguages.bulkCreate(languageRecords, { transaction });
                await this._movieProjectionTypes.bulkCreate(projectionRecords, { transaction });

                return movie;
            });

            return this.getMovieDetail(createdMovie.id);
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
        const movie = await this._movies.getFull(id);
        if (!movie) throw new NotFoundError('Película no encontrada');

        const previousPosterUrl: string | null = movie.poster_url ?? null;
        const previousBannerUrl: string | null = movie.banner_url ?? null;

        const { synopsis, trailerUrl } = body;
        const lifecycleState = body.lifecycleState !== undefined ? Number(body.lifecycleState) : undefined;
        const genres: number[] | undefined =
            body.genres === undefined
                ? undefined
                : typeof body.genres === 'string'
                  ? JSON.parse(body.genres)
                  : (body.genres as number[]);

        const languages: number[] | undefined =
            body.languages === undefined
                ? undefined
                : typeof body.languages === 'string'
                  ? JSON.parse(body.languages)
                  : (body.languages as number[]);

        const projectionTypes: number[] | undefined =
            body.projectionTypes === undefined
                ? undefined
                : typeof body.projectionTypes === 'string'
                  ? JSON.parse(body.projectionTypes)
                  : (body.projectionTypes as number[]);

        movieImagesService.validateTrailerUrl(trailerUrl);

        const updateData: Record<string, any> = {};
        if (lifecycleState !== undefined) updateData.lifecycle_state = lifecycleState;
        if (synopsis !== undefined) updateData.synopsis = synopsis;
        if (trailerUrl !== undefined) updateData.trailer_url = trailerUrl;

        if (
            Object.keys(updateData).length === 0 &&
            genres === undefined &&
            languages === undefined &&
            projectionTypes === undefined &&
            !rawFiles
        )
            throw new ValidationError('No se proporcionaron datos para actualizar', []);

        if (genres !== undefined) {
            for (const genreId of genres) {
                const genre = await this._genres.getById(genreId);
                if (!genre) throw new ValidationError(`El género con ID ${genreId} no existe`, ['genres']);
            }
        }

        if (languages !== undefined) {
            for (const languageId of languages) {
                const language = await this._languages.getById(languageId);
                if (!language) throw new ValidationError(`El idioma con ID ${languageId} no existe`, ['languages']);
            }
        }

        if (projectionTypes !== undefined) {
            for (const projectionId of projectionTypes) {
                const projectionType = await this._projectionTypes.getById(projectionId);
                if (!projectionType)
                    throw new ValidationError(`El formato de proyección con ID ${projectionId} no existe`, [
                        'projectionTypes',
                    ]);
            }
        }

        const imageFiles = movieImagesService.extractFromRequest(rawFiles);
        const { posterUrl, bannerUrl, posterFileId, bannerFileId } =
            await movieImagesService.uploadMovieImages(imageFiles);

        if (posterUrl) updateData.poster_url = posterUrl;
        if (bannerUrl) updateData.banner_url = bannerUrl;

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

                if (languages !== undefined) {
                    await this._movieLanguages.deleteByMovie(id, { transaction });
                    if (languages.length > 0) {
                        const records = languages.map((lId: number) => ({ movie: id, language: lId }));
                        await this._movieLanguages.bulkCreate(records, { transaction });
                    }
                }

                if (projectionTypes !== undefined) {
                    await this._movieProjectionTypes.deleteByMovie(id, { transaction });
                    if (projectionTypes.length > 0) {
                        const records = projectionTypes.map((pId: number) => ({ movie: id, projection_type: pId }));
                        await this._movieProjectionTypes.bulkCreate(records, { transaction });
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
