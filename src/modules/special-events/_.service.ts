import { BaseService } from '@bases/service.base.js';
import { Database } from '@database/index.js';
import { ConflictError, NotFoundError, ValidationError } from '@errors';
import { movieImagesService } from '@services/movie-images.service.js';
import { imageStorageService } from '@services/image-storage.service.js';
import { Logger } from '@utils/logger.util.js';
import { type ProcessedQueryFilters } from '@rules/api-query.type.js';
import ShowtimeManagementService from '@services/showtime-management.service.js';

interface CreateSpecialEventBody {
    title: string;
    description: string;
    durationMinutes: number | string;
    ageClassification: number | string;
    lifecycleState?: number | string;
    trailerUrl?: string;
    posterUrl?: string;
    releaseDate: string;
    endDate?: string;
}

interface UpdateSpecialEventBody {
    title?: string;
    description?: string;
    durationMinutes?: number | string;
    ageClassification?: number | string;
    lifecycleState?: number | string;
    trailerUrl?: string;
    posterUrl?: string;
    releaseDate?: string;
    endDate?: string;
}

export class SpecialEventsService extends BaseService {
    constructor() {
        super();
    }

    private get _specialEvents() {
        return Database.repository('main', 'special-events') as any;
    }
    private get _ageClassifications() {
        return Database.repository('main', 'age-classifications') as any;
    }
    private get _lifecycleStates() {
        return Database.repository('main', 'movie-lifecycle-states') as any;
    }
    private get _showtimes() {
        return Database.repository('main', 'showtimes') as any;
    }

    // P+ublicos - Catálogo general

    async getPublicEvents(filters?: ProcessedQueryFilters) {
        return this._specialEvents.getAllFull(filters);
    }

    async getUpcomingEvents(filters?: ProcessedQueryFilters) {
        return this._specialEvents.getAllFull({
            ...filters,
            where: { lifecycle_state: 1, deleted_at: null },
        });
    }

    // Públicos - Filtros por lifecycle

    // Próximamente — lifecycle_state = 1
    async getUpcoming(filters?: ProcessedQueryFilters) {
        return this._specialEvents.getAll({ ...filters, count: true }, { lifecycle_state: 1, deleted_at: null });
    }

    // En Cartelera (Estreno) — lifecycle_state = 2
    async getOnPremiere(filters?: ProcessedQueryFilters) {
        return this._specialEvents.getAll({ ...filters, count: true }, { lifecycle_state: 2, deleted_at: null });
    }

    // En Cartelera (Regular) — lifecycle_state = 3
    async getInBillboard(filters?: ProcessedQueryFilters) {
        return this._specialEvents.getAll({ ...filters, count: true }, { lifecycle_state: 3, deleted_at: null });
    }

    //Últimos Días — lifecycle_state = 4
    async getLastDays(filters?: ProcessedQueryFilters) {
        return this._specialEvents.getAll({ ...filters, count: true }, { lifecycle_state: 4, deleted_at: null });
    }

    // Públicos - Cartelera y funciones

    async getPublicEventDetail(id: number) {
        const event = await this._specialEvents.getFull(id);
        if (!event) throw new NotFoundError('Evento especial no encontrado');
        return event;
    }

    async getPublicBillboard(cinemaId?: number) {
        return ShowtimeManagementService.getEventsBillboard(cinemaId);
    }

    async getPublicEventShowtimes(eventId: number, cinemaId: number) {
        if (!cinemaId)
            throw new ValidationError('El campo cinemaId es obligatorio para consultar funciones públicas', [
                'cinemaId',
            ]);
        return ShowtimeManagementService.getEventShowtimesByCinema(eventId, cinemaId);
    }

    // Administrativos

    async getAdminEvents(filters?: ProcessedQueryFilters) {
        return this._specialEvents.getAllFull(filters);
    }

    async getAdminEventDetail(id: number) {
        const event = await this._specialEvents.getFull(id);
        if (!event) throw new NotFoundError('Evento especial no encontrado');
        return event;
    }

    async getAdminEventShowtimes(filters: {
        cinemaId?: number;
        eventId?: number;
        startDate?: string;
        endDate?: string;
        onlyFuture?: boolean;
        [key: string]: any;
    }) {
        return ShowtimeManagementService.findAllShowtimes({
            ...filters,
            onlyEvents: true,
        });
    }

    // Superadmin
    async createEvent(
        body: CreateSpecialEventBody,
        rawFiles?: Express.Multer.File[] | { [fieldname: string]: Express.Multer.File[] },
    ) {
        const { title, description, releaseDate, trailerUrl } = body;

        const durationMinutes = Number(body.durationMinutes);
        const ageClassification = Number(body.ageClassification);
        const lifecycleState = body.lifecycleState ? Number(body.lifecycleState) : 1;
        const endDate = body.endDate ?? null;

        this.validateRequired({ title, description, durationMinutes, ageClassification, releaseDate } as any, [
            'title',
            'description',
            'durationMinutes',
            'ageClassification',
            'releaseDate',
        ]);

        if (!Number.isInteger(durationMinutes) || durationMinutes <= 0)
            throw new ValidationError('La duración debe ser un entero mayor a 0', ['durationMinutes']);

        movieImagesService.validateTrailerUrl(trailerUrl);

        const existing = await this._specialEvents.getOne({ title, deleted_at: null });
        if (existing) throw new ConflictError('Ya existe un evento especial con ese título', 'EVENT_TITLE_DUPLICATE');

        const ageClass = await this._ageClassifications.getById(ageClassification);
        if (!ageClass) throw new ValidationError('La clasificación de edad indicada no existe', ['ageClassification']);

        const lifecycle = await this._lifecycleStates.getById(lifecycleState);
        if (!lifecycle) throw new ValidationError('El estado de ciclo de vida indicado no existe', ['lifecycleState']);

        const imageFiles = movieImagesService.extractFromRequest(rawFiles);
        const {
            posterUrl: uploadedPosterUrl,
            bannerUrl,
            posterFileId,
            bannerFileId,
        } = await movieImagesService.uploadMovieImages(imageFiles);

        const finalPosterUrl = uploadedPosterUrl ?? body.posterUrl ?? null;

        try {
            const created = await this._specialEvents.create({
                title,
                description,
                duration_minutes: durationMinutes,
                age_classification: ageClassification,
                lifecycle_state: lifecycleState,
                trailer_url: trailerUrl ?? null,
                poster_url: finalPosterUrl,
                banner_url: bannerUrl ?? null,
                release_date: releaseDate,
                end_date: endDate,
            });

            return this.getAdminEventDetail(created.id);
        } catch (error) {
            await movieImagesService.rollbackUploadedImages([posterFileId, bannerFileId]);
            throw error;
        }
    }

    async updateEvent(
        id: number,
        body: UpdateSpecialEventBody,
        rawFiles?: Express.Multer.File[] | { [fieldname: string]: Express.Multer.File[] },
    ) {
        const event = await this.getAdminEventDetail(id);

        const previousPosterUrl: string | null = event.poster_url ?? null;
        const previousBannerUrl: string | null = event.banner_url ?? null;

        const updateData: Record<string, any> = {};

        if (body.title !== undefined) updateData.title = body.title;
        if (body.description !== undefined) updateData.description = body.description;

        if (body.durationMinutes !== undefined) {
            const dur = Number(body.durationMinutes);
            if (!Number.isInteger(dur) || dur <= 0)
                throw new ValidationError('La duración debe ser un entero mayor a 0', ['durationMinutes']);
            updateData.duration_minutes = dur;
        }

        if (body.ageClassification !== undefined) {
            const age = Number(body.ageClassification);
            const exists = await this._ageClassifications.getById(age);
            if (!exists)
                throw new ValidationError('La clasificación de edad indicada no existe', ['ageClassification']);
            updateData.age_classification = age;
        }

        if (body.lifecycleState !== undefined) {
            const state = Number(body.lifecycleState);
            const exists = await this._lifecycleStates.getById(state);
            if (!exists) throw new ValidationError('El estado de ciclo de vida indicado no existe', ['lifecycleState']);
            updateData.lifecycle_state = state;
        }

        if (body.trailerUrl !== undefined) {
            movieImagesService.validateTrailerUrl(body.trailerUrl);
            updateData.trailer_url = body.trailerUrl;
        }

        if (body.releaseDate !== undefined) updateData.release_date = body.releaseDate;
        if (body.endDate !== undefined) updateData.end_date = body.endDate;

        const imageFiles = movieImagesService.extractFromRequest(rawFiles);
        const {
            posterUrl: uploadedPosterUrl,
            bannerUrl,
            posterFileId,
            bannerFileId,
        } = await movieImagesService.uploadMovieImages(imageFiles);

        const finalPosterUrl = uploadedPosterUrl ?? body.posterUrl ?? null;
        if (finalPosterUrl) updateData.poster_url = finalPosterUrl;
        if (bannerUrl) updateData.banner_url = bannerUrl;

        if (Object.keys(updateData).length === 0)
            throw new ValidationError('No se proporcionaron datos para actualizar', []);

        try {
            await this._specialEvents.update(id, updateData);

            if (uploadedPosterUrl && previousPosterUrl) {
                imageStorageService
                    .deleteImageByUrl(previousPosterUrl)
                    .catch((err: any) => Logger.error('updateEvent: error al eliminar poster anterior', err));
            }
            if (bannerUrl && previousBannerUrl) {
                imageStorageService
                    .deleteImageByUrl(previousBannerUrl)
                    .catch((err: any) => Logger.error('updateEvent: error al eliminar banner anterior', err));
            }
        } catch (error) {
            await movieImagesService.rollbackUploadedImages([posterFileId, bannerFileId]);
            throw error;
        }

        return this.getAdminEventDetail(id);
    }

    async deleteEvent(id: number) {
        const event = await this.getAdminEventDetail(id);

        let activeShowtimes = 0;
        try {
            activeShowtimes = await this._showtimes.count({ special_event_id: id, deleted_at: null } as any);
        } catch {
            /* Si el repositorio aún no reconoce el campo, no bloquear */
        }

        if (activeShowtimes > 0)
            throw new ConflictError(
                'No se puede eliminar el evento porque tiene funciones programadas activas.',
                'EVENT_HAS_ACTIVE_SHOWTIMES',
            );

        await this._specialEvents.delete(id);

        if (event.poster_url) {
            imageStorageService
                .deleteImageByUrl(event.poster_url)
                .catch((err: any) => Logger.error('deleteEvent: error al eliminar poster', err));
        }
        if (event.banner_url) {
            imageStorageService
                .deleteImageByUrl(event.banner_url)
                .catch((err: any) => Logger.error('deleteEvent: error al eliminar banner', err));
        }

        return null;
    }
}

export default new SpecialEventsService();
