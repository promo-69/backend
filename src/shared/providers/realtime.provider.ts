import * as http from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { AppConfig } from '@config/app.config.js';
import { CacheDatabaseProvider } from '@providers/cache-database.provider.js';
import { socketAuth } from '@middlewares/auth.middleware.js';
import { RealtimeError } from '@errors/realtime.error.js';
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
		const wrappedHandler = (socket: Socket, data: any) => {
			let parsedData = data;
			if (typeof data === 'string') {
				try {
					parsedData = JSON.parse(data);
				} catch (e) {
					Logger.warn(`[Socket.io] Fallo al parsear payload del evento ${event}`);
				}
			}

			handler(socket, parsedData);
		};
		this._eventHandlers.set(event, wrappedHandler);
	}

	emitToSocket(socketId: string, event: string, data: any): void {
		try {
			this.io.to(socketId).emit(event, data);
		} catch (error: any) {
			throw new RealtimeError(`Error emitting to socket ${socketId}:`, error);
		}
	}

	emitToRoom(room: string, event: string, data: any): void {
		try {
			this.io.to(room).emit(event, data);
		} catch (error: any) {
			throw new RealtimeError(`Error emitting to room ${room}:`, error);
		}
	}

	broadcastToRoomExclude(room: string, event: string, data: any, excludeSocketId?: string): void {
		try {
			if (excludeSocketId) {
				const socket = this.io.sockets.sockets.get(excludeSocketId);
				if (socket) {
					socket.broadcast.to(room).emit(event, data);
					return;
				}
			}
			this.io.to(room).emit(event, data);
		} catch (error: any) {
			throw new RealtimeError(`Error broadcasting to room ${room}:`, error);
		}
	}

	broadcast(event: string, data: any): void {
		try {
			this.io.emit(event, data);
		} catch (error: any) {
			throw new RealtimeError(`Error broadcasting event ${event}:`, error);
		}
	}

	joinRoom(socketId: string, room: string): void {
		try {
			const socket = this.io.sockets.sockets.get(socketId);
			if (socket) socket.join(room);
		} catch (error: any) {
			throw new RealtimeError(`Error joining room ${room} for socket ${socketId}:`, error);
		}
	}

	leaveRoom(socketId: string, room: string): void {
		try {
			const socket = this.io.sockets.sockets.get(socketId);
			if (socket) socket.leave(room);
		} catch (error: any) {
			throw new RealtimeError(`Error leaving room ${room} for socket ${socketId}:`, error);
		}
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
			socket.onAny((event, ...args) => {
				const handler = this._eventHandlers.get(event);
				if (handler) {
					handler(socket, args[0]);
				}
			});

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
		this._eventHandlers.clear();
	}
}

// Limpieza para Vite HMR
if (import.meta.hot) {
	import.meta.hot.dispose(async () => {
		await RealtimeProvider.getInstance().close();
		const REALTIME_PROVIDER_SYMBOL = Symbol.for('global.realtime.provider');
		delete (globalThis as any)[REALTIME_PROVIDER_SYMBOL];
	});
}
