import { ImageCloudProvider } from '@providers/image-cloud.provider.js';
import { Logger } from '@utils/logger.util.js';
import { UnknownError } from '@errors/index.js';

export class ImageStorageService {
	private get client() {
		return ImageCloudProvider.getInstance().client;
	}

	async uploadImage(buffer: Buffer, originalName: string, folder: string): Promise<{ url: string; fileId: string }> {
		try {
			const result = await this.client.upload({
				file: buffer,
				fileName: originalName,
				folder: folder,
				useUniqueFileName: true,
			});

			return {
				url: result.url,
				fileId: result.fileId,
			};
		} catch (error: any) {
			const wrappedError = new UnknownError(error);
			Logger.error('Error uploading image: ', wrappedError);

			throw wrappedError;
		}
	}

	async deleteImage(fileId: string): Promise<boolean> {
		try {
			await this.client.deleteFile(fileId);
			return true;
		} catch (error: any) {
			const wrappedError = new UnknownError(error);
			Logger.error('Error deleting image: ', wrappedError);

			throw wrappedError;
		}
	}
}

export const imageStorageService = new ImageStorageService();
