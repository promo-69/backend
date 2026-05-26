import { BaseService } from '@bases/service.base.js';
import { Database } from '@database/index.js';
import { ConflictError, NotFoundError, ValidationError } from '@errors';
import { movieImagesService } from '@services/movie-images.service.js';
import { imageStorageService } from '@services/image-storage.service.js';
import { Logger } from '@utils/logger.util.js';
import { type ProcessedQueryFilters } from '@rules/api-query.type.js';
import { type Transaction } from 'sequelize';
import { Op } from 'sequelize';

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
    private get _movieLifecycleStates() {
        return Database.repository('main', 'movie-lifecycle-states') as any;
    }

    private async _enrichMovie(movie: any) {
        if (!movie) return null;

        // Clasificación de edad
        if (typeof movie.age_classification === 'number') {
            const ageClass = await this._ageClassifications.getById(movie.age_classification, {
                attributes: ['id', 'description'],
            });
            movie.age_classification = ageClass ? { id: ageClass.id, description: ageClass.description } : null;
        } else if (movie.age_classification?.id) {
            // ya es un objeto, lo dejamos como está
        }

        // Estado de ciclo de vida
        if (typeof movie.lifecycle_state === 'number') {
            const lifecycle = await this._movieLifecycleStates.getById(movie.lifecycle_state, {
                attributes: ['id', 'description'],
            });
            movie.lifecycle_state = lifecycle ? { id: lifecycle.id, description: lifecycle.description } : null;
        } else if (movie.lifecycle_state?.id) {
            // ya es un objeto
        }

        // Géneros, idiomas y tipos de proyección: si ya son arrays de objetos, no hacemos nada
        if (!Array.isArray(movie.genres) && movie._MovieGenres) {
            const genreLinks = await this._movieGenres.getAll(
                { count: false, attributes: ['genre'] },
                { movie: movie.id },
            );
            const genreIds = (Array.isArray(genreLinks) ? genreLinks : genreLinks.rows).map((g: any) => g.genre);
            if (genreIds.length > 0) {
                const genres = await this._genres.getAll(
                    { count: false, attributes: ['id', 'description'] },
                    { id: genreIds },
                );
                movie.genres = Array.isArray(genres) ? genres : genres.rows;
            } else {
                movie.genres = [];
            }
        }

        if (!Array.isArray(movie.languages) && movie._MovieLanguages) {
            const langLinks = await this._movieLanguages.getAll(
                { count: false, attributes: ['language'] },
                { movie: movie.id },
            );
            const langIds = (Array.isArray(langLinks) ? langLinks : langLinks.rows).map((l: any) => l.language);
            if (langIds.length > 0) {
                const languages = await this._languages.getAll(
                    { count: false, attributes: ['id', 'description'] },
                    { id: langIds },
                );
                movie.languages = Array.isArray(languages) ? languages : languages.rows;
            } else {
                movie.languages = [];
            }
        }

        if (!Array.isArray(movie.projection_types) && movie._MovieProjectionTypes) {
            const projLinks = await this._movieProjectionTypes.getAll(
                { count: false, attributes: ['projection_type'] },
                { movie: movie.id },
            );
            const projIds = (Array.isArray(projLinks) ? projLinks : projLinks.rows).map((p: any) => p.projection_type);
            if (projIds.length > 0) {
                const projTypes = await this._projectionTypes.getAll(
                    { count: false, attributes: ['id', 'description'] },
                    { id: projIds },
                );
                movie.projection_types = Array.isArray(projTypes) ? projTypes : projTypes.rows;
            } else {
                movie.projection_types = [];
            }
        }

        // Limpiar asociaciones crudas si existen
        delete movie._AgeClassifications;
        delete movie._LifecycleStates;
        delete movie._MovieGenres;
        delete movie._MovieLanguages;
        delete movie._MovieProjectionTypes;

        return movie;
    }

    // ─── Métodos públicos ────────────────────────────────────────

    async getMovies(filters?: ProcessedQueryFilters) {
        const result = await this._movies.getAllFull(filters);
        if (Array.isArray(result)) {
            return Promise.all(result.map((m) => this._enrichMovie(m)));
        }
        result.rows = await Promise.all(result.rows.map((m: any) => this._enrichMovie(m)));
        return result;
    }

    /**
     * Devuelve las películas que tienen al menos un showtime activo (sin tocar el repositorio de movies).
     */
    async getMoviesWithShowtimes(filters?: ProcessedQueryFilters) {
        const showtimesRepo = Database.repository('main', 'showtimes') as any;
        const rawShowtimes = await showtimesRepo.getAll({ count: false, attributes: ['movie'] });
        const showtimesList = Array.isArray(rawShowtimes) ? rawShowtimes : rawShowtimes.rows;
        const movieIds = [...new Set(showtimesList.map((s: any) => s.movie))];

        if (movieIds.length === 0) {
            return { count: 0, rows: [] };
        }

        const result = await this._movies.getAllFull({ ...filters, filters: { id: movieIds } });
        if (Array.isArray(result)) {
            return Promise.all(result.map((m) => this._enrichMovie(m)));
        }
        result.rows = await Promise.all(result.rows.map((m: any) => this._enrichMovie(m)));
        return result;
    }

    async getMovieDetail(id: number) {
        const movie = await this._movies.getFull(id);
        if (!movie) throw new NotFoundError('Película no encontrada');
        return this._enrichMovie(movie);
    }

    async createMovie(body: CreateMovieBody, rawFiles?: any) {
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

                await this._movieGenres.bulkCreate(
                    genres.map((gId) => ({ movie: movie.id, genre: gId })),
                    { transaction },
                );
                await this._movieLanguages.bulkCreate(
                    languages.map((lId) => ({ movie: movie.id, language: lId })),
                    { transaction },
                );
                await this._movieProjectionTypes.bulkCreate(
                    projectionTypes.map((pId) => ({ movie: movie.id, projection_type: pId })),
                    { transaction },
                );

                return movie;
            });

            return this.getMovieDetail(createdMovie.id);
        } catch (error) {
            await movieImagesService.rollbackUploadedImages([posterFileId, bannerFileId]);
            throw error;
        }
    }

    async updateMovie(id: number, body: UpdateMovieBody & { imageFiles?: any }) {
        const movie = await this._movies.getFull(id);
        if (!movie) throw new NotFoundError('Película no encontrada');

        const previousPosterUrl: string | null = movie.poster_url ?? null;
        const previousBannerUrl: string | null = movie.banner_url ?? null;

        const {
            synopsis,
            trailerUrl,
            lifecycleState,
            genres: rawGenres,
            languages: rawLanguages,
            projectionTypes: rawProjTypes,
            imageFiles: rawImageFiles,
        } = body;
        const lifecycleStateNum = lifecycleState !== undefined ? Number(lifecycleState) : undefined;
        const genres: number[] | undefined =
            rawGenres === undefined ? undefined : typeof rawGenres === 'string' ? JSON.parse(rawGenres) : rawGenres;
        const languages: number[] | undefined =
            rawLanguages === undefined
                ? undefined
                : typeof rawLanguages === 'string'
                  ? JSON.parse(rawLanguages)
                  : rawLanguages;
        const projectionTypes: number[] | undefined =
            rawProjTypes === undefined
                ? undefined
                : typeof rawProjTypes === 'string'
                  ? JSON.parse(rawProjTypes)
                  : rawProjTypes;

        movieImagesService.validateTrailerUrl(trailerUrl);

        const updateData: Record<string, any> = {};
        if (lifecycleStateNum !== undefined) updateData.lifecycle_state = lifecycleStateNum;
        if (synopsis !== undefined) updateData.synopsis = synopsis;
        if (trailerUrl !== undefined) updateData.trailer_url = trailerUrl;

        if (
            Object.keys(updateData).length === 0 &&
            genres === undefined &&
            languages === undefined &&
            projectionTypes === undefined &&
            !rawImageFiles
        )
            throw new ValidationError('No se proporcionaron datos para actualizar', []);

        if (genres)
            for (const gId of genres) {
                if (!(await this._genres.getById(gId)))
                    throw new ValidationError(`El género con ID ${gId} no existe`, ['genres']);
            }
        if (languages)
            for (const lId of languages) {
                if (!(await this._languages.getById(lId)))
                    throw new ValidationError(`El idioma con ID ${lId} no existe`, ['languages']);
            }
        if (projectionTypes)
            for (const pId of projectionTypes) {
                if (!(await this._projectionTypes.getById(pId)))
                    throw new ValidationError(`El formato de proyección con ID ${pId} no existe`, ['projectionTypes']);
            }

        const imageFiles = movieImagesService.extractFromRequest(rawImageFiles);
        const { posterUrl, bannerUrl, posterFileId, bannerFileId } =
            await movieImagesService.uploadMovieImages(imageFiles);
        if (posterUrl) updateData.poster_url = posterUrl;
        if (bannerUrl) updateData.banner_url = bannerUrl;

        try {
            await this._movies.transaction(async (transaction: Transaction) => {
                if (Object.keys(updateData).length > 0) await this._movies.update(id, updateData, { transaction });

                if (genres) {
                    await this._movieGenres.deleteByMovie(id, { transaction });
                    if (genres.length > 0)
                        await this._movieGenres.bulkCreate(
                            genres.map((gId) => ({ movie: id, genre: gId })),
                            { transaction },
                        );
                }
                if (languages) {
                    await this._movieLanguages.deleteByMovie(id, { transaction });
                    if (languages.length > 0)
                        await this._movieLanguages.bulkCreate(
                            languages.map((lId) => ({ movie: id, language: lId })),
                            { transaction },
                        );
                }
                if (projectionTypes) {
                    await this._movieProjectionTypes.deleteByMovie(id, { transaction });
                    if (projectionTypes.length > 0)
                        await this._movieProjectionTypes.bulkCreate(
                            projectionTypes.map((pId) => ({ movie: id, projection_type: pId })),
                            { transaction },
                        );
                }
            });
        } catch (error) {
            await movieImagesService.rollbackUploadedImages([posterFileId, bannerFileId]);
            throw error;
        }

        if (posterUrl && previousPosterUrl)
            imageStorageService
                .deleteImageByUrl(previousPosterUrl)
                .catch((err) => Logger.error('updateMovie: failed to delete old poster', err));
        if (bannerUrl && previousBannerUrl)
            imageStorageService
                .deleteImageByUrl(previousBannerUrl)
                .catch((err) => Logger.error('updateMovie: failed to delete old banner', err));

        return this.getMovieDetail(id);
    }

    async deleteMovie(id: number) {
        const movie = await this._movies.getFull(id);
        if (!movie) throw new NotFoundError('Película no encontrada');

        // Verificar funciones futuras activas (sin try/catch, sin comentarios)
        const showtimesRepo = Database.repository('main', 'showtimes') as any;
        const activeFutureShowtimes = await showtimesRepo.count({
            movie: id,
            deleted_at: null,
            start_time: { [Op.gt]: new Date() },
        });

        if (activeFutureShowtimes > 0) {
            throw new ConflictError(
                'No se puede retirar la película porque tiene funciones futuras activas.',
                'MOVIE_HAS_ACTIVE_SHOWTIMES',
            );
        }

        await this._movies.delete(id);
        return null;
    }
}

export default new MoviesService();
