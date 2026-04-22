import { BaseService } from '@bases/service.base.js';
import { Database } from '@database/index.js';
import { ConflictError, NotFoundError, ValidationError } from '@errors';
import { type ProcessedQueryFilters } from '@rules/api-query.type.js';
import { type Transaction } from 'sequelize';

interface CreateMovieBody {
    title: string;
    duration_minutes: number;
    age_classification: number;
    lifecycle_state: number;
    synopsis: string;
    poster_url?: string;
    banner_url?: string;
    trailer_url?: string;
    release_date: string;
    genres: number[];
}

interface UpdateMovieBody {
    lifecycle_state?: number;
    synopsis?: string;
    poster_url?: string;
    banner_url?: string;
    trailer_url?: string;
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
        if (!movie || movie.status !== 1) throw new NotFoundError('Película no encontrada');
        return movie;
    }

    // --- HU-OPERATIVA-12/13: Registrar película ---
    async createMovie(body: CreateMovieBody) {
        const {
            title,
            duration_minutes,
            age_classification,
            lifecycle_state,
            synopsis,
            poster_url,
            banner_url,
            trailer_url,
            release_date,
            genres,
        } = body;

        this.validateRequired(
            { title, duration_minutes, age_classification, lifecycle_state, synopsis, release_date } as any,
            ['title', 'duration_minutes', 'age_classification', 'lifecycle_state', 'synopsis', 'release_date'],
        );

        if (!Array.isArray(genres) || genres.length === 0)
            throw new ValidationError('Debe especificar al menos un género', ['genres']);

        if (!Number.isInteger(duration_minutes) || duration_minutes <= 0)
            throw new ValidationError('La duración debe ser un entero mayor a 0', ['duration_minutes']);

        // Verificar título único
        const existing = await this._movies.getByTitle(title);
        if (existing) throw new ConflictError('Ya existe una película con ese título', 'MOVIE_TITLE_DUPLICATE');

        // Verificar que age_classification exista
        const ageClass = await this._ageClassifications.getById(age_classification);
        if (!ageClass) throw new ValidationError('La clasificación de edad indicada no existe', ['age_classification']);

        // Verificar que todos los géneros existan
        for (const genreId of genres) {
            const genre = await this._genres.getById(genreId);
            if (!genre) throw new ValidationError(`El género con ID ${genreId} no existe en el catálogo`, ['genres']);
        }

        const createdMovie = await this._movies.transaction(async (transaction: Transaction) => {
            const movie = await this._movies.create(
                {
                    title,
                    duration_minutes,
                    age_classification,
                    lifecycle_state,
                    synopsis,
                    poster_url: poster_url ?? null,
                    banner_url: banner_url ?? null,
                    trailer_url: trailer_url ?? null,
                    release_date,
                    status: 1,
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
    }

    // --- HU-OPERATIVA-13 (Edición): Editar película ---
    async updateMovie(id: number, body: UpdateMovieBody) {
        const movie = await this._movies.getFull(id);
        if (!movie || movie.status !== 1) throw new NotFoundError('Película no encontrada');

        const { genres, ...rest } = body;
        const updateData: Record<string, any> = {};

        const allowedFields = ['lifecycle_state', 'synopsis', 'poster_url', 'banner_url', 'trailer_url'];
        for (const field of allowedFields) {
            if ((rest as any)[field] !== undefined) updateData[field] = (rest as any)[field];
        }

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
                        status: 1,
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
        if (!movie || movie.status !== 1) throw new NotFoundError('Película no encontrada');

        let activeShowtimes = 0;
        try {
            activeShowtimes = await Database.repository('main', 'showtimes').count({ movie: id, status: 1 } as any);
        } catch {
            /* módulo showtimes aún no implementado */
        }

        if (activeShowtimes > 0)
            throw new ConflictError(
                'No se puede retirar la película porque tiene funciones futuras activas.',
                'MOVIE_HAS_ACTIVE_SHOWTIMES',
            );

        await this._movies.update(id, { status: 4 });
        return null;
    }
}

export default new MoviesService();
