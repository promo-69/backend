import { RealtimeProvider } from '@providers/realtime.provider.js';
import { Logger } from '@utils/logger.util.js';

export class RealtimeService {
    // Patrón Fachada: SIN constructores ni instancias
    private constructor() {}

    static emitToSocket(socketId: string, event: string, data: any): void {
        try {
            const io = RealtimeProvider.getInstance().io;
            io.to(socketId).emit(event, data);
        } catch (error: any) {
            Logger.error(`[RealtimeService] Error emitting to socket ${socketId}:`, error);
        }
    }

    static emitToRoom(room: string, event: string, data: any): void {
        try {
            const io = RealtimeProvider.getInstance().io;
            io.to(room).emit(event, data);
        } catch (error: any) {
            Logger.error(`[RealtimeService] Error emitting to room ${room}:`, error);
        }
    }

    static broadcast(event: string, data: any): void {
        try {
            const io = RealtimeProvider.getInstance().io;
            io.emit(event, data);
        } catch (error: any) {
            Logger.error(`[RealtimeService] Error broadcasting event ${event}:`, error);
        }
    }

    static joinRoom(socketId: string, room: string): void {
        try {
            const io = RealtimeProvider.getInstance().io;
            const socket = io.sockets.sockets.get(socketId);
            if (socket) {
                socket.join(room);
            }
        } catch (error: any) {
            Logger.error(`[RealtimeService] Error joining room ${room} for socket ${socketId}:`, error);
        }
    }

    static leaveRoom(socketId: string, room: string): void {
        try {
            const io = RealtimeProvider.getInstance().io;
            const socket = io.sockets.sockets.get(socketId);
            if (socket) {
                socket.leave(room);
            }
        } catch (error: any) {
            Logger.error(`[RealtimeService] Error leaving room ${room} for socket ${socketId}:`, error);
        }
    }
}
