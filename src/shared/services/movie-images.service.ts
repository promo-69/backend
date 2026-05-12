import { imageStorageService } from './image-storage.service.js';
import { ValidationError } from '@errors/index.js';

export interface MovieImageFiles {
    poster?: Express.Multer.File;
    banner?: Express.Multer.File;
}

export interface MovieImageUrls {
    posterUrl: string | null;
    bannerUrl: string | null;
}

export class MovieImagesService {
    private static readonly FOLDER = 'cineflix/movies';
    private static readonly POSTER_FOLDER = `${MovieImagesService.FOLDER}/posters`;
    private static readonly BANNER_FOLDER = `${MovieImagesService.FOLDER}/banners`;

    /**
     * Sube las imágenes (poster y/o banner) a ImageKit.
     * Cualquiera de los dos puede ser undefined si no se envió en el request.
     *
     * @param files Objeto con los buffers de multer (req.files como objeto de campos)
     * @returns Objeto con las URLs resultantes (null si no se subió el archivo)
     */
    async uploadMovieImages(files: MovieImageFiles): Promise<MovieImageUrls> {
        const results: MovieImageUrls = {
            posterUrl: null,
            bannerUrl: null,
        };

        const uploads: Promise<void>[] = [];

        if (files.poster) {
            const posterFile = files.poster;
            uploads.push(
                imageStorageService
                    .uploadImage(posterFile.buffer, posterFile.originalname, MovieImagesService.POSTER_FOLDER)
                    .then(({ url }) => {
                        results.posterUrl = url;
                    }),
            );
        }

        if (files.banner) {
            const bannerFile = files.banner;
            uploads.push(
                imageStorageService
                    .uploadImage(bannerFile.buffer, bannerFile.originalname, MovieImagesService.BANNER_FOLDER)
                    .then(({ url }) => {
                        results.bannerUrl = url;
                    }),
            );
        }

        // Subir ambas imágenes en paralelo para reducir latencia
        await Promise.all(uploads);

        return results;
    }

    /**
     * Extrae los archivos del objeto req.files que genera multer
     * cuando se usa uploadFields (multer.fields).
     * req.files tiene la forma: { poster: [File], banner: [File] }
     *
     * @param rawFiles El req.files del request Express
     * @returns MovieImageFiles normalizado (primer archivo de cada campo)
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
     * El trailer es una URL externa (YouTube, Vimeo, etc.), no un archivo subido.
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
