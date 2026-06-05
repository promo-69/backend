import { RealtimeError } from '@errors/realtime.error.js';
import { RealtimeProvider } from '@providers/realtime.provider.js';

export class RealtimeService {
	private constructor() {}

	static registerEventHandler(event: string, handler: (socket: any, data: any) => void): void {
		RealtimeProvider.getInstance().registerEventHandler(event, handler);
	}

	static emitToSocket(socketId: string, event: string, data: any): void {
		try {
			const io = RealtimeProvider.getInstance().io;
			io.to(socketId).emit(event, data);
		} catch (error: any) {
			throw new RealtimeError(`Error emitting to socket ${socketId}:`, error);
		}
	}

	static emitToRoom(room: string, event: string, data: any): void {
		try {
			const io = RealtimeProvider.getInstance().io;
			io.to(room).emit(event, data);
		} catch (error: any) {
			throw new RealtimeError(`Error emitting to room ${room}:`, error);
		}
	}

	static broadcastToRoomExclude(room: string, event: string, data: any, excludeSocketId?: string): void {
		try {
			const io = RealtimeProvider.getInstance().io;
			if (excludeSocketId) {
				const socket = io.sockets.sockets.get(excludeSocketId);
				if (socket) {
					socket.broadcast.to(room).emit(event, data);
					return;
				}
			}
			io.to(room).emit(event, data);
		} catch (error: any) {
			throw new RealtimeError(`Error broadcasting to room ${room}:`, error);
		}
	}

	static broadcast(event: string, data: any): void {
		try {
			const io = RealtimeProvider.getInstance().io;
			io.emit(event, data);
		} catch (error: any) {
			throw new RealtimeError(`Error broadcasting event ${event}:`, error);
		}
	}

	static joinRoom(socketId: string, room: string): void {
		try {
			const io = RealtimeProvider.getInstance().io;
			const socket = io.sockets.sockets.get(socketId);

			if (socket) socket.join(room);
		} catch (error: any) {
			throw new RealtimeError(`Error joining room ${room} for socket ${socketId}:`, error);
		}
	}

	static leaveRoom(socketId: string, room: string): void {
		try {
			const io = RealtimeProvider.getInstance().io;
			const socket = io.sockets.sockets.get(socketId);

			if (socket) socket.leave(room);
		} catch (error: any) {
			throw new RealtimeError(`Error leaving room ${room} for socket ${socketId}:`, error);
		}
	}
}
