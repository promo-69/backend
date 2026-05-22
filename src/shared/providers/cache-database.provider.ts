import IORedis from 'ioredis';
import type { Redis } from 'ioredis';
import { AppConfig } from '@config/app.config.js';
import { Logger } from '@utils/logger.util.js';
import { ANSI } from '@utils/ansi.util.js';
import { RequestContext } from '@utils/request-context.util.js';

const RedisConstructor = (IORedis as any).default || IORedis;
const CACHE_DATABASE_CLIENT_SYMBOL = Symbol.for('global.cache.client');

export class CacheDatabaseProvider {
	private static _instance: CacheDatabaseProvider;

	// Usamos el tipo puro de TypeScript 'Redis'
	private _client: Redis;
	private _testClient: Redis;
	private _pubClient?: Redis;
	private _subClient?: Redis;

	private constructor() {
		const config = AppConfig.load();

		const redisConfig = {
			host: config.cacheDatabase.host,
			port: config.cacheDatabase.port,
			...(config.cacheDatabase.username &&
				config.cacheDatabase.password && {
					username: config.cacheDatabase.username,
					password: config.cacheDatabase.password,
				}),
			retryStrategy(times: number) {
				const delay = Math.min(times * 50, 2000);
				return delay;
			},
			maxRetriesPerRequest: null,
			enableReadyCheck: true,
		};

		this._client = new RedisConstructor(redisConfig);
		this._testClient = new RedisConstructor({ ...redisConfig, keyPrefix: 'testenv.' });

		this._client.on('connect', () => {
			Logger.natural(
				ANSI.success(`[+] Connected to Redis at ${config.cacheDatabase.host}:${config.cacheDatabase.port}`),
			);
		});

		this._client.on('error', (err: any) => Logger.error('Redis Provider Error:', err));
		this._testClient.on('error', (err: any) => Logger.error('Redis Test Provider Error:', err));
	}

	static getInstance(): CacheDatabaseProvider {
		if (AppConfig.isProduction()) {
			if (!this._instance) this._instance = new CacheDatabaseProvider();

			return this._instance;
		} else {
			// Mitigación para Vite HMR
			const globalWithRedis = globalThis as typeof globalThis & {
				[CACHE_DATABASE_CLIENT_SYMBOL]: CacheDatabaseProvider;
			};

			if (!globalWithRedis[CACHE_DATABASE_CLIENT_SYMBOL])
				globalWithRedis[CACHE_DATABASE_CLIENT_SYMBOL] = new CacheDatabaseProvider();

			return globalWithRedis[CACHE_DATABASE_CLIENT_SYMBOL];
		}
	}

	get client(): Redis {
		const context = RequestContext.getStore();
		if (context?.isTestingRequest) return this._testClient;

		return this._client;
	}

	get pubClient(): Redis {
		if (!this._pubClient) {
			this._pubClient = this._client.duplicate();
			this._pubClient.on('error', (err: any) => Logger.error('Redis PubClient Error:', err));
		}
		return this._pubClient;
	}

	get subClient(): Redis {
		if (!this._subClient) {
			this._subClient = this._client.duplicate();
			this._subClient.on('error', (err: any) => Logger.error('Redis SubClient Error:', err));
		}
		return this._subClient;
	}

	async disconnect(): Promise<void> {
		await this._client.quit();
		await this._testClient.quit();
	}
}
