import { RealtimeProvider } from '@providers/realtime.provider.js';
import { ConflictError } from '@errors';
import { CacheDatabaseProvider } from '@providers/cache-database.provider.js';

export class SeatLockService {
	private get _redis() {
		return CacheDatabaseProvider.getInstance().client;
	}

	async handleQuoteExpiration(queueId: string, userId: number) {
		RealtimeProvider.getInstance().emitToRoom(`queue_${queueId}`, 'quote_expired', {});
	}

	async handleSeatExpiration(showtimeId: number, seatId: number, queueId: string) {
		RealtimeProvider.getInstance().emitToRoom(`showtime_${showtimeId}`, 'seats_unlocked', { seatIds: [seatId] });
		if (queueId) RealtimeProvider.getInstance().emitToRoom(`queue_${queueId}`, 'seat_lock_expired', { seatId, showtimeId });
	}

	/**
	 * Bloquea un asiento temporalmente para un usuario durante la seleccion.
	 * Utiliza Redis para asegurar que nadie mas pueda tomarlo de forma atómica.
	 */
	async lockSeat(showtimeId: number, seatId: number, userId: number, socketId?: string) {
		const lockKey = `lock:showtime:${showtimeId}:seat:${seatId}`;
		const success = await this._redis.set(lockKey, String(userId), 'EX', 480, 'NX');

		if (!success) throw new ConflictError('Asiento ocupado');

		const expireTimestamp = Date.now() + 480000;
		await this._redis.zadd(`showtime:${showtimeId}:locked_seats`, expireTimestamp, String(seatId));

		if (socketId) RealtimeProvider.getInstance().emitToSocket(socketId, 'seat_lock_success', { seatId });

		RealtimeProvider.getInstance().broadcastToRoomExclude(`showtime_${showtimeId}`, 'seat_locked_by_other', { seatId }, socketId);

		return true;
	}

	async unlockSeat(showtimeId: number, seatId: number, userId: number) {
		const lockKey = `lock:showtime:${showtimeId}:seat:${seatId}`;
		const lockedUserId = await this._redis.get(lockKey);

		if (lockedUserId === String(userId)) {
			await this._redis.del(lockKey);
			await this._redis.zrem(`showtime:${showtimeId}:locked_seats`, String(seatId));
			RealtimeProvider.getInstance().emitToRoom(`showtime_${showtimeId}`, 'seat_unlocked', { seatId });
			return true;
		}

		return false;
	}
}
