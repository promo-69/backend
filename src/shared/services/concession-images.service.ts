import { imageStorageService } from './image-storage.service.js';
import { Logger } from '@utils/logger.util.js';

export interface ConcessionImageFiles {
    image?: Express.Multer.File;
}

export interface ConcessionImageUploadResult {
    imageUrl: string | null;
    imageFileId: string | null;
}

export class ConcessionImagesService {
    private static readonly PRODUCT_FOLDER = 'cineflix/products';
    private static readonly COMBO_FOLDER = 'cineflix/combos';

    async uploadProductImage(imageFile?: Express.Multer.File): Promise<ConcessionImageUploadResult> {
        if (!imageFile) return { imageUrl: null, imageFileId: null };
        const { url, fileId } = await imageStorageService.uploadImage(
            imageFile.buffer,
            imageFile.originalname,
            ConcessionImagesService.PRODUCT_FOLDER,
        );
        return { imageUrl: url, imageFileId: fileId };
    }

    async uploadComboImage(imageFile?: Express.Multer.File): Promise<ConcessionImageUploadResult> {
        if (!imageFile) return { imageUrl: null, imageFileId: null };
        const { url, fileId } = await imageStorageService.uploadImage(
            imageFile.buffer,
            imageFile.originalname,
            ConcessionImagesService.COMBO_FOLDER,
        );
        return { imageUrl: url, imageFileId: fileId };
    }

    async rollbackUploadedImages(fileIds: (string | null)[]): Promise<void> {
        const deletions = fileIds
            .filter((id): id is string => id !== null)
            .map((id) =>
                imageStorageService.deleteImage(id).catch((err) => Logger.error('Rollback delete failed:', err)),
            );
        await Promise.all(deletions);
    }

    extractImage(
        rawFiles: Express.Multer.File[] | { [fieldname: string]: Express.Multer.File[] } | undefined,
    ): Express.Multer.File | undefined {
        if (!rawFiles || Array.isArray(rawFiles)) return undefined;
        return rawFiles['image']?.[0];
    }
}

export const concessionImagesService = new ConcessionImagesService();
