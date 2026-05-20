import RealtimeProvider from '@providers/realtime.provider.js';
import { Logger } from '@utils/logger.util.js';
import type { Socket } from 'socket.io';

export class RealtimeService {
	private static _instance: RealtimeService;

	static getInstance(): RealtimeService {
		if (!this._instance) this._instance = new RealtimeService();
		return this._instance;
	}

	private constructor() {}

	emitToSocket(socketId: string, event: string, payload: any, namespace = '/') {
		try {
			const io = RealtimeProvider.getInstance().io;
			const nsp = io.of(namespace);
			const sock: any = (nsp as any).sockets.get?.(socketId) || (nsp as any).connected?.[socketId];
			if (sock) {
				sock.emit(event, payload);
				return true;
			}

			return false;
		} catch (err: any) {
			Logger.error('emitToSocket error:', err);
			return false;
		}
	}

	emitToRoom(namespace: string, room: string, event: string, payload: any) {
		try {
			const io = RealtimeProvider.getInstance().io;
			const nsp = io.of(namespace);
			nsp.to(room).emit(event, payload);
			return true;
		} catch (err: any) {
			Logger.error('emitToRoom error:', err);
			return false;
		}
	}

	broadcast(namespace: string, event: string, payload: any, opts?: { exceptSocketId?: string }) {
		try {
			const io = RealtimeProvider.getInstance().io;
			const nsp = io.of(namespace);
			if (opts?.exceptSocketId) {
				nsp.except(opts.exceptSocketId).emit(event, payload);
			} else {
				nsp.emit(event, payload);
			}
			return true;
		} catch (err: any) {
			Logger.error('broadcast error:', err);
			return false;
		}
	}

	async joinRoom(socket: Socket | string, namespace: string, room: string) {
		try {
			const io = RealtimeProvider.getInstance().io;
			const nsp = io.of(namespace);
			let sock: any;
			if (typeof socket === 'string') {
				sock = (nsp as any).sockets.get?.(socket) || (nsp as any).connected?.[socket];
			} else {
				sock = socket;
			}

			if (!sock) return false;
			await sock.join(room);
			return true;
		} catch (err: any) {
			Logger.error('joinRoom error:', err);
			return false;
		}
	}

	async leaveRoom(socket: Socket | string, namespace: string, room: string) {
		try {
			const io = RealtimeProvider.getInstance().io;
			const nsp = io.of(namespace);
			let sock: any;
			if (typeof socket === 'string') {
				sock = (nsp as any).sockets.get?.(socket) || (nsp as any).connected?.[socket];
			} else {
				sock = socket;
			}

			if (!sock) return false;
			await sock.leave(room);
			return true;
		} catch (err: any) {
			Logger.error('leaveRoom error:', err);
			return false;
		}
	}

	registerNamespaceHandler(namespace: string, factory: (socket: Socket) => void) {
		try {
			const io = RealtimeProvider.getInstance().io;
			const nsp = io.of(namespace);
			nsp.on('connection', (socket: Socket) => {
				factory(socket);
			});
		} catch (err: any) {
			Logger.error('registerNamespaceHandler error:', err);
		}
	}
}

export default RealtimeService.getInstance();
