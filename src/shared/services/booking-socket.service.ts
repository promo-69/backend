import { RealtimeService } from './realtime.service.js';
import { SeatLockService } from './seat-lock.service.js';
import { Logger } from '@utils/logger.util.js';
import { CacheDatabaseProvider } from '@providers/cache-database.provider.js';

export class BookingSocketService {
	static initialize() {
		// Suscripción a la sala de una función
		RealtimeService.registerEventHandler('join_showtime', async (socket, data: { showtimeId: number }) => {
			if (!data?.showtimeId) return;
			socket.join(`showtime_${data.showtimeId}`);

			const user = socket.data.session;
			if (user?.userId) {
				const redis = CacheDatabaseProvider.getInstance().client;
				await redis.set(`ws:context:usr:${user.userId}`, String(data.showtimeId), 'EX', 3600);
			}
		});

		// Desuscripción a la sala
		RealtimeService.registerEventHandler('leave_showtime', async (socket, data: { showtimeId: number }) => {
			if (!data?.showtimeId) return;
			socket.leave(`showtime_${data.showtimeId}`);

			const user = socket.data.session;
			if (user?.userId) {
				const redis = CacheDatabaseProvider.getInstance().client;
				await redis.del(`ws:context:usr:${user.userId}`);

				const lockedSeatsKey = `usr:${user.userId}:showtime:${data.showtimeId}:locked_seats`;
				const seatIdsRaw = await redis.smembers(lockedSeatsKey);

				if (seatIdsRaw && seatIdsRaw.length > 0) {
					await redis.del(lockedSeatsKey);
					const seatIds = seatIdsRaw.map(Number);

					const pipeline = redis.pipeline();
					for (const seatId of seatIds) {
						pipeline.del(`lock:showtime:${data.showtimeId}:seat:${seatId}`);
					}
					await pipeline.exec();

					RealtimeService.emitToRoom(`showtime_${data.showtimeId}`, 'seats_unlocked', { seatIds });
				}
			}
		});

		// Intento de bloquear un asiento
		RealtimeService.registerEventHandler('lock_seat', async (socket, data: { seatId: number }) => {
			const user = socket.data.session;
			if (!user?.userId || !data?.seatId) return;
			try {
				const redis = CacheDatabaseProvider.getInstance().client;
				const showtimeIdRaw = await redis.get(`ws:context:usr:${user.userId}`);
				if (!showtimeIdRaw) throw new Error('No estás conectado a ninguna función');
				const showtimeId = Number(showtimeIdRaw);

				const seatLockService = new SeatLockService();
				await seatLockService.lockSeat(showtimeId, data.seatId, user.userId, socket.id);

				await redis.sadd(`usr:${user.userId}:showtime:${showtimeId}:locked_seats`, String(data.seatId));
				await redis.expire(`usr:${user.userId}:showtime:${showtimeId}:locked_seats`, 3600);
			} catch (err: any) {
				socket.emit('seat_lock_error', {
					message: err.message,
					seatId: data.seatId,
				});
			}
		});

		// Intento de liberar un asiento
		RealtimeService.registerEventHandler('unlock_seat', async (socket, data: { seatId: number }) => {
			const user = socket.data.session;
			if (!user?.userId || !data?.seatId) return;
			try {
				const redis = CacheDatabaseProvider.getInstance().client;
				const showtimeIdRaw = await redis.get(`ws:context:usr:${user.userId}`);
				if (!showtimeIdRaw) return;
				const showtimeId = Number(showtimeIdRaw);

				const seatLockService = new SeatLockService();
				const unlocked = await seatLockService.unlockSeat(showtimeId, data.seatId, user.userId);

				if (unlocked) {
					await redis.srem(`usr:${user.userId}:showtime:${showtimeId}:locked_seats`, String(data.seatId));
				}
			} catch (err: any) {
				Logger.error(`[Socket.io] Error unlocking seat: ${err.message}`, err);
			}
		});
	}
}
