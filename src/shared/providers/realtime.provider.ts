import * as http from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { AppConfig } from '@config/app.config.js';
import { CacheDatabaseProvider } from '@providers/cache-database.provider.js';
import { socketAuth } from '@middlewares/auth.middleware.js';
import { Logger } from '@utils/logger.util.js';
import { ANSI } from '@utils/ansi.util.js';

import redisAdapterPkg from '@socket.io/redis-adapter';

export class RealtimeProvider {
	private static _instance: RealtimeProvider;
	private _io!: SocketIOServer | undefined;

	private constructor() {}

	static getInstance(): RealtimeProvider {
		if (AppConfig.isProduction()) {
			if (!this._instance) this._instance = new RealtimeProvider();
			return this._instance;
		}

		const REALTIME_PROVIDER_SYMBOL = Symbol.for('global.realtime.provider');
		const globalWithRealtime = globalThis as typeof globalThis & {
			[REALTIME_PROVIDER_SYMBOL]: RealtimeProvider;
		};

		if (!globalWithRealtime[REALTIME_PROVIDER_SYMBOL])
			globalWithRealtime[REALTIME_PROVIDER_SYMBOL] = new RealtimeProvider();

		return globalWithRealtime[REALTIME_PROVIDER_SYMBOL];
	}

	get io(): SocketIOServer {
		if (!this._io) throw new Error('Socket.io no ha sido inicializado. Llama a attach() primero.');
		return this._io;
	}

	private _eventHandlers = new Map<string, (socket: Socket, data: any) => void>();

	registerEventHandler(event: string, handler: (socket: Socket, data: any) => void) {
		this._eventHandlers.set(event, handler);
	}

	async attach(server: http.Server): Promise<void> {
		if (this._io) {
			await this.close();
		}

		this._io = new SocketIOServer(server, {
			cors: {
				origin: AppConfig.load().corsOptions.origin,
				methods: ['GET', 'POST'],
				credentials: true,
			},
		});

		// Adaptador Redis
		const cache = CacheDatabaseProvider.getInstance();
		this._io.adapter(redisAdapterPkg.createAdapter(cache.pubClient, cache.subClient));

		this._io.use(socketAuth);

		this._io.on('connection', (socket: Socket) => {
			const user = socket.data.session;
			Logger.info(ANSI.info(`[Socket.io] Socket connected: ${socket.id} | User: ${user?.userId}`));

			// Registrar handlers dinámicos
			for (const [event, handler] of this._eventHandlers.entries()) {
				socket.on(event, (data) => handler(socket, data));
			}

			socket.on('disconnect', () => {
				Logger.info(ANSI.info(`[Socket.io] Socket disconnected: ${socket.id}`));
			});
		});

		Logger.natural(ANSI.success(`[+] Realtime Provider (Socket.io) initialized`));
	}

	async close(): Promise<void> {
		if (!this._io) return;

		await this._io.close();

		this._io = undefined;
	}
}

// Limpieza para Vite HMR
if (import.meta.hot) {
	import.meta.hot.dispose(async () => {
		await RealtimeProvider.getInstance().close();
	});
}
