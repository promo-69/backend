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

			return { url: result.url, fileId: result.fileId };
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

	async getFileIdByUrl(url: string | null | undefined): Promise<string | null> {
		if (!url) return null;

		try {
			const cleanUrl = url.split('?')[0].split('#')[0];
			const urlObj = new URL(cleanUrl);
			const pathParts = urlObj.pathname.split('/').filter(Boolean);

			const filePath = '/' + pathParts.slice(1).join('/');

			Logger.natural(`getFileIdByUrl: searching for filePath = ${filePath}`);

			const files = await this.client.listFiles({
				searchQuery: `filePath = "${filePath}"`,
				limit: 1,
			} as any);

			if (!Array.isArray(files) || files.length === 0) {
				Logger.error(`getFileIdByUrl: no file found for filePath = ${filePath}`, new Error('File not found'));
				return null;
			}

			return (files[0] as any).fileId ?? null;
		} catch (error) {
			Logger.error(
				`getFileIdByUrl: could not resolve fileId for url: ${url}`,
				error instanceof Error ? error : new Error(String(error)),
			);
			return null;
		}
	}

	async deleteImageByUrl(url: string | null | undefined): Promise<void> {
		const fileId = await this.getFileIdByUrl(url);
		if (!fileId) {
			if (url) Logger.error(`deleteImageByUrl: fileId not found for url: ${url}`, new Error('FileId not found'));
			return;
		}
		await this.deleteImage(fileId).catch((err) =>
			Logger.error(
				`deleteImageByUrl: failed to delete fileId ${fileId}`,
				err instanceof Error ? err : new Error(String(err)),
			),
		);
	}
}

export const imageStorageService = new ImageStorageService();
