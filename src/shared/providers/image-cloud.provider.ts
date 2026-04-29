import ImageKit from 'imagekit';
import { AppConfig } from '@config/app.config.js';
import { Logger } from '@utils/logger.util.js';
import { ANSI } from '@utils/ansi.util.js';

const IMAGE_CLOUD_CLIENT_SYMBOL = Symbol.for('global.imagecloud.client');

export class ImageCloudProvider {
	private static _instance: ImageCloudProvider;
	private _client: ImageKit;

	private constructor() {
		const config = AppConfig.load();

		try {
			this._client = new ImageKit(config.imageCloud);

			Logger.natural(ANSI.success('[+] Connected to ImageKit Cloud Provider'));
		} catch (error) {
			Logger.error('ImageCloud Provider Error:', error as Error);
			throw error;
		}
	}

	static getInstance(): ImageCloudProvider {
		if (AppConfig.isProduction()) {
			if (!this._instance) this._instance = new ImageCloudProvider();

			return this._instance;
		} else {
			// Mitigación para Vite HMR
			const globalWithImageCloud = globalThis as typeof globalThis & {
				[IMAGE_CLOUD_CLIENT_SYMBOL]: ImageCloudProvider;
			};

			if (!globalWithImageCloud[IMAGE_CLOUD_CLIENT_SYMBOL])
				globalWithImageCloud[IMAGE_CLOUD_CLIENT_SYMBOL] = new ImageCloudProvider();

			return globalWithImageCloud[IMAGE_CLOUD_CLIENT_SYMBOL];
		}
	}

	get client(): InstanceType<typeof ImageKit> {
		return this._client;
	}
}
