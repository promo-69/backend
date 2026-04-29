import { type CorsOptions } from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: resolve(__dirname, '..', '..', '.env'), quiet: true });

export interface IAppConfig {
	port: number;
	host: string;
	protocol: string;
	nodeEnv: string;
	apiBaseUrl: string;
	corsOptions: CorsOptions;
	enableCors: boolean;
	enableHelmet: boolean;
	enableMorgan: boolean;
	enableDatabase: boolean;
	enableDocs: boolean;
	enableImageCloud: boolean;
	databases: {
		enabled: string[]; // ['postgres', 'mongodb']
		default: string;
	};
	security: {
		jwtSecret: string;
		jwtRefreshSecret: string;
		jwtAccessExpiresIn: string;
		jwtRefreshExpiresIn: string;
		jwtCookieAccessName: string;
		jwtCookieRefreshName: string;
		authTransport: string;
		bcryptRounds: number;
	};
	limits: {
		requestSize: string;
		rateLimitWindow: number;
		rateLimitMax: number;
	};
	cacheDatabase: {
		host: string;
		port: number;
		username?: string;
		password?: string;
	};
	emailProvider: {
		host: string;
		port: number;
		user: string;
		pass: string;
		from: string;
	};
	docs?: {
		path: string;
		title: string;
		description: string;
	};
	imageCloud?: {
		publicKey: string;
		privateKey: string;
		urlEndpoint: string;
	};
}

export class AppConfig {
	private static _configCache: IAppConfig | null = null;

	static clearCache(): void {
		this._configCache = null;
	}

	static load(): IAppConfig {
		if (this._configCache) return this._configCache;

		const nodeEnv = (process.env.NODE_ENV || 'development').toLocaleLowerCase();
		const protocol = (process.env.SECURE_PROTOCOL === 'true' ? 'https' : 'http').toLocaleLowerCase();
		const host = (process.env.DOMAIN || process.env.API_HOST || '127.0.0.1').toLocaleLowerCase();
		const port = parseInt((process.env.PORT || '3000').toString(), 10);
		const apiBaseUrl = `${protocol}://${host}${port !== 80 && port !== 443 ? `:${port}` : ''}`;

		// Parsear bases de datos habilitadas
		const enabledDatabases = (process.env.ENABLED_DATABASES ?? '')
			.split(',')
			.map((db) => db.trim())
			.filter((db) => db);

		const config = {
			port,
			host,
			protocol,
			nodeEnv,
			apiBaseUrl,
			corsOptions: {
				methods: ['GET', 'PUT', 'POST', 'DELETE', 'PATCH', 'OPTIONS'],
				credentials: true,
				origin: process.env.CORS_ORIGIN?.split(',') || '*',
				allowedHeaders: [
					'Content-Type',
					'Authorization',
					'X-Requested-With',
					'Upload',
					'Content-Disposition',
					'Content-Length',
				],
			},
			enableCors: process.env.ENABLE_CORS === 'true',
			enableHelmet: process.env.ENABLE_HELMET === 'true',
			enableMorgan: process.env.ENABLE_MORGAN === 'true',
			enableDatabase: process.env.ENABLE_DATABASE === 'true',
			enableDocs: process.env.ENABLE_DOCS === 'true',
			enableImageCloud: process.env.ENABLE_IMAGE_CLOUD === 'true',
			databases: {
				enabled: enabledDatabases,
				default: process.env.DEFAULT_DATABASE || enabledDatabases[0],
			},
			security: {
				jwtSecret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
				jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key-change-in-production',
				jwtAccessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '1h',
				jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
				jwtCookieAccessName: process.env.JWT_COOKIE_ACCESS_NAME || 'AT',
				jwtCookieRefreshName: process.env.JWT_COOKIE_REFRESH_NAME || 'RT',
				authTransport: process.env.AUTH_TRANSPORT || 'bearer',
				bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || '10', 10),
			},
			limits: {
				requestSize: process.env.REQUEST_SIZE_LIMIT || '10mb',
				rateLimitWindow: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
				rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
			},
			cacheDatabase: {
				host: process.env.CACHE_DATABASE_HOST as string,
				port: parseInt(process.env.CACHE_DATABASE_PORT as string, 10),
				...(process.env.CACHE_DATABASE_USERNAME &&
					process.env.CACHE_DATABASE_PASSWORD && {
						username: process.env.CACHE_DATABASE_USERNAME as string,
						password: process.env.CACHE_DATABASE_PASSWORD as string,
					}),
			},
			emailProvider: {
				host: process.env.EMAIL_HOST || 'smtp.gmail.com',
				port: parseInt(process.env.EMAIL_PORT || '465', 10),
				user: process.env.EMAIL_USER || '',
				pass: process.env.EMAIL_PASS || '',
				from: process.env.EMAIL_FROM || 'no-reply@cineflix.com',
			},
			docs: {
				path: process.env.DOCS_PATH || '/api-docs',
				title: process.env.DOCS_TITLE || 'CineFlix API',
				description: process.env.DOCS_DESCRIPTION || 'Documentación de la API de CineFlix',
			},
			imageCloud: {
				publicKey: process.env.IMAGECLOUD_PUBLIC_KEY || '',
				privateKey: process.env.IMAGECLOUD_PRIVATE_KEY || '',
				urlEndpoint: process.env.IMAGECLOUD_URL_ENDPOINT || '',
			},
		};
		this._configCache = config;

		return config;
	}

	static isProduction(): boolean {
		return this.load().nodeEnv.toLocaleLowerCase() === 'production';
	}

	static isDevelopment(): boolean {
		return this.load().nodeEnv.toLocaleLowerCase() === 'development';
	}

	static getEnabledDatabases(): string[] {
		return this.load().databases.enabled;
	}

	static getDefaultDatabase(): string {
		return this.load().databases.default;
	}
}
