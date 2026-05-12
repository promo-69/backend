import { imageStorageService } from './image-storage.service.js';
import { ValidationError } from '@errors/index.js';
import { Logger } from '@utils/logger.util.js';

export interface MovieImageFiles {
    poster?: Express.Multer.File;
    banner?: Express.Multer.File;
}

export interface MovieImageUploadResult {
    posterUrl: string | null;
    bannerUrl: string | null;
    posterFileId: string | null;
    bannerFileId: string | null;
}

export class MovieImagesService {
    private static readonly FOLDER = 'cineflix/movies';
    private static readonly POSTER_FOLDER = `${MovieImagesService.FOLDER}/posters`;
    private static readonly BANNER_FOLDER = `${MovieImagesService.FOLDER}/banners`;

    /**
     * Sube las imágenes (poster y/o banner) a ImageKit.
     * Devuelve tanto las URLs como los IDs de archivo, necesarios para un posterior rollback.
     */
    async uploadMovieImages(files: MovieImageFiles): Promise<MovieImageUploadResult> {
        const result: MovieImageUploadResult = {
            posterUrl: null,
            bannerUrl: null,
            posterFileId: null,
            bannerFileId: null,
        };

        const uploads: Promise<void>[] = [];

        if (files.poster) {
            const posterFile = files.poster;
            uploads.push(
                imageStorageService
                    .uploadImage(posterFile.buffer, posterFile.originalname, MovieImagesService.POSTER_FOLDER)
                    .then(({ url, fileId }) => {
                        result.posterUrl = url;
                        result.posterFileId = fileId;
                    }),
            );
        }

        if (files.banner) {
            const bannerFile = files.banner;
            uploads.push(
                imageStorageService
                    .uploadImage(bannerFile.buffer, bannerFile.originalname, MovieImagesService.BANNER_FOLDER)
                    .then(({ url, fileId }) => {
                        result.bannerUrl = url;
                        result.bannerFileId = fileId;
                    }),
            );
        }

        await Promise.all(uploads);

        return result;
    }

    /**
     * Elimina de ImageKit los archivos cuyos IDs se proporcionen.
     * Útil para revertir subidas si la transacción de BD falla.
     * Ignora valores nulos y captura errores sin detener el proceso.
     */
    async rollbackUploadedImages(fileIds: (string | null)[]): Promise<void> {
        const deletions = fileIds
            .filter((id): id is string => id !== null)
            .map((id) =>
                imageStorageService.deleteImage(id).catch((err) => {
                    Logger.error('Rollback delete failed:', err);
                }),
            );

        await Promise.all(deletions);
    }

    /**
     * Extrae los archivos del objeto req.files que genera multer
     * cuando se usa uploadFields (multer.fields).
     */
    extractFromRequest(
        rawFiles: Express.Multer.File[] | { [fieldname: string]: Express.Multer.File[] } | undefined,
    ): MovieImageFiles {
        if (!rawFiles || Array.isArray(rawFiles)) {
            return { poster: undefined, banner: undefined };
        }

        return {
            poster: rawFiles['poster']?.[0],
            banner: rawFiles['banner']?.[0],
        };
    }

    /**
     * Valida que la URL del trailer tenga un formato aceptable.
     */
    validateTrailerUrl(url: string | undefined): void {
        if (!url) return;

        try {
            new URL(url);
        } catch {
            throw new ValidationError('El enlace del tráiler no tiene un formato de URL válido', ['trailerUrl']);
        }
    }
}

export const movieImagesService = new MovieImagesService();
