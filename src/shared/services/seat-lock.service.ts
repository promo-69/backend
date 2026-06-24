import { RealtimeProvider } from '@providers/realtime.provider.js';
import { ConflictError } from '@errors';
import { CacheDatabaseProvider } from '@providers/cache-database.provider.js';

export class SeatLockService {
	private get _redis() {
		return CacheDatabaseProvider.getInstance().client;
	}

	async handleQuoteExpiration(userId: number) {
		const redis = this._redis;
		const showtimeIdRaw = await redis.get(`ws:context:usr:${userId}`);

		if (showtimeIdRaw) {
			const showtimeId = Number(showtimeIdRaw);
			await this.forceUnlockUserSeats(showtimeId, userId);
		}

		RealtimeProvider.getInstance().emitToRoom(`usr_${userId}`, 'quote_expired', {});
	}

	async forceUnlockUserSeats(showtimeId: number, userId: number) {
		const redis = this._redis;
		const lockedSeatsKey = `usr:${userId}:showtime:${showtimeId}:locked_seats`;
		const seatIdsRaw = await redis.smembers(lockedSeatsKey);

		if (seatIdsRaw && seatIdsRaw.length > 0) {
			await redis.del(lockedSeatsKey);
			const seatIds = seatIdsRaw.map(Number);
			const pipeline = redis.pipeline();

			for (const seatId of seatIds) {
				pipeline.del(`lock:showtime:${showtimeId}:seat:${seatId}`);
				pipeline.zrem(`showtime:${showtimeId}:locked_seats`, String(seatId));
			}
			await pipeline.exec();

			RealtimeProvider.getInstance().emitToRoom(`showtime_${showtimeId}`, 'seats_unlocked', { seatIds });
		}
	}

	async handleSeatExpiration(showtimeId: number, seatId: number) {
		const redis = CacheDatabaseProvider.getInstance().client;
		await redis.zrem(`showtime:${showtimeId}:locked_seats`, String(seatId));
		RealtimeProvider.getInstance().emitToRoom(`showtime_${showtimeId}`, 'seats_unlocked', { seatIds: [seatId] });
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

export default new SeatLockService();
