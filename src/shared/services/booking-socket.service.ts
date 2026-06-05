import { RealtimeProvider } from '@providers/realtime.provider.js';
import { SeatLockService } from './seat-lock.service.js';
import { Logger } from '@utils/logger.util.js';
import { CacheDatabaseProvider } from '@providers/cache-database.provider.js';

export class BookingSocketService {
	static initialize() {
		// Suscripción a la sala de una función
		RealtimeProvider.getInstance().registerEventHandler('join_showtime', async (socket, data: any) => {
			if (!data?.showtimeId) return;

			const user = socket.data.session;
			if (user?.userId) {
				const redis = CacheDatabaseProvider.getInstance().client;

				// Verificar que exista una sesión de compra iniciada
				const userQueueKey = `queue:usr:${user.userId}`;
				const quoteRaw = await redis.get(userQueueKey);

				if (!quoteRaw) {
					socket.emit('session_error', {
						message: 'Debe iniciar una sesión de compra para unirse a la sala',
					});
					return;
				}
				socket.join(`showtime_${data.showtimeId}`);
				await redis.set(`ws:context:usr:${user.userId}`, String(data.showtimeId), 'EX', 3600);
			}
		});

		// Desuscripción a la sala
		RealtimeProvider.getInstance().registerEventHandler('leave_showtime', async (socket, data: any) => {
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

					RealtimeProvider.getInstance().emitToRoom(`showtime_${data.showtimeId}`, 'seats_unlocked', {
						seatIds,
					});
				}
			}
		});

		// Intento de bloquear un asiento
		RealtimeProvider.getInstance().registerEventHandler('lock_seat', async (socket, data: any) => {
			const user = socket.data.session;
			if (!user?.userId || !data?.seatId) return;
			try {
				const redis = CacheDatabaseProvider.getInstance().client;

				// Verificar que exista una sesión de compra iniciada
				const userQueueKey = `queue:usr:${user.userId}`;
				const quoteRaw = await redis.get(userQueueKey);
				if (!quoteRaw) throw new Error('La sesión de compra no existe o ha expirado');

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
		RealtimeProvider.getInstance().registerEventHandler('unlock_seat', async (socket, data: any) => {
			const user = socket.data.session;
			if (!user?.userId || !data?.seatId) return;
			try {
				const redis = CacheDatabaseProvider.getInstance().client;

				// Verificar que exista una sesión de compra iniciada
				const userQueueKey = `queue:usr:${user.userId}`;
				const quoteRaw = await redis.get(userQueueKey);
				if (!quoteRaw) throw new Error('La sesión de compra no existe o ha expirado');

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
