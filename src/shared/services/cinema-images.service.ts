import { imageStorageService } from './image-storage.service.js';
import { Logger } from '@utils/logger.util.js';

export interface CinemaImageFiles {
	image?: Express.Multer.File;
}

export interface CinemaImageUploadResult {
	imageUrl: string | null;
	imageFileId: string | null;
}

export class CinemaImagesService {
	private static readonly FOLDER = 'cineflix/cinemas';

	/**
	 * Sube la imagen de la sucursal a ImageKit.
	 * Devuelve la URL y el ID del archivo, necesarios para un posterior rollback.
	 */
	async uploadCinemaImage(files: CinemaImageFiles): Promise<CinemaImageUploadResult> {
		const result: CinemaImageUploadResult = {
			imageUrl: null,
			imageFileId: null,
		};

		const uploads: Promise<void>[] = [];

		if (files.image) {
			const imageFile = files.image;
			uploads.push(
				imageStorageService
					.uploadImage(imageFile.buffer, imageFile.originalname, CinemaImagesService.FOLDER)
					.then(({ url, fileId }) => {
						result.imageUrl = url;
						result.imageFileId = fileId;
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
	 * Elimina de ImageKit una imagen usando su URL.
	 */
	async deleteCinemaImageByUrl(url: string | null | undefined): Promise<void> {
		await imageStorageService.deleteImageByUrl(url);
	}

	/**
	 * Extrae los archivos del objeto req.files que genera multer
	 * cuando se usa uploadFields (multer.fields).
	 */
	extractFromRequest(
		rawFiles: Express.Multer.File[] | { [fieldname: string]: Express.Multer.File[] } | undefined,
	): CinemaImageFiles {
		if (!rawFiles || Array.isArray(rawFiles)) {
			return { image: undefined };
		}

		return {
			image: rawFiles['image']?.[0],
		};
	}
}

export const cinemaImagesService = new CinemaImagesService();
