import type { Server as HttpServer } from 'http';
import { Server as IOServer } from 'socket.io';
import { AppConfig } from '@config/app.config.js';
import { CacheDatabaseProvider } from '@providers/cache-database.provider.js';
import { Logger } from '@utils/logger.util.js';

const REALTIME_PROVIDER_SYMBOL = Symbol.for('global.realtime.provider');

export class RealtimeProvider {
	private static _instance: RealtimeProvider;
	private _io?: IOServer;

	private constructor() {}

	static getInstance(): RealtimeProvider {
		if (AppConfig.isProduction()) {
			if (!this._instance) this._instance = new RealtimeProvider();
			return this._instance;
		}

		const globalWithRealtime = globalThis as typeof globalThis & {
			[REALTIME_PROVIDER_SYMBOL]: RealtimeProvider;
		};

		if (!globalWithRealtime[REALTIME_PROVIDER_SYMBOL])
			globalWithRealtime[REALTIME_PROVIDER_SYMBOL] = new RealtimeProvider();

		return globalWithRealtime[REALTIME_PROVIDER_SYMBOL];
	}

	async attach(server: HttpServer): Promise<void> {
		if (this._io) return;

		const config = AppConfig.load();
		const path = (config as any).realtime?.path || '/socket.io';

		this._io = new IOServer(server, {
			path,
			cors: config.enableCors ? (config.corsOptions as any) : undefined,
		});

		try {
			const adapterType = (config as any).realtime?.adapter || 'memory';
			if (adapterType === 'redis') {
				const cache = CacheDatabaseProvider.getInstance();
				const pub = cache.pubClient;
				const sub = cache.subClient;
				const mod = await import('@socket.io/redis-adapter');
				const createAdapter = (mod as any).createAdapter || (mod as any).default;
				if (createAdapter) {
					(this._io as any).adapter(createAdapter(pub as any, sub as any));
					Logger.natural('Realtime: Redis adapter attached');
				}
			}
		} catch (err: any) {
			Logger.error('RealtimeProvider adapter error:', err);
		}

		this._io.on('connection', (socket) => {
			Logger.natural(`Realtime: client connected ${socket.id} on namespace ${socket.nsp.name}`);
		});
	}

	get io(): IOServer {
		if (!this._io) throw new Error('RealtimeProvider not attached');
		return this._io;
	}

	async close(): Promise<void> {
		if (!this._io) return;
		await this._io.close();
		this._io = undefined;
	}
}

export default RealtimeProvider;
