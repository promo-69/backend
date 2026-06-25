import { RealtimeProvider } from '@providers/realtime.provider.js';
import seatLockService from '@services/seat-lock.service.js';
import { Logger } from '@utils/logger.util.js';
import { CacheDatabaseProvider } from '@providers/cache-database.provider.js';
import { Database } from '@database/index.js';

export class BookingSocketService {
	static initialize() {
		// Suscripción a la sala de una función
		RealtimeProvider.getInstance().registerEventHandler('join_showtime', async (socket, data: any) => {
			const user = socket.data.session;
			Logger.info(`[WS] Accediendo a join_showtime - user: ${user?.userId}, data: ${JSON.stringify(data)}`);
			if (!data?.showtimeId) return;

			if (user?.userId) {
				const redis = CacheDatabaseProvider.getInstance().client;

				// Verificar que exista una sesión de compra iniciada
				const userQueueKey = `queue:usr:${user.userId}`;
				const quoteRaw = await redis.get(userQueueKey);

				if (!quoteRaw) {
					Logger.warn(`[WS] join_showtime error - Sesión expirada o no existe (user: ${user.userId})`);
					RealtimeProvider.getInstance().emitToSocket(socket.id, 'join_error', {
						message: 'Función no válida para la sucursal actual o sesión expirada',
					});
					return;
				}

				const quoteData = JSON.parse(quoteRaw);

				// Verificar si el usuario ya estaba en otra función y limpiarla
				const previousShowtimeIdRaw = await redis.get(`ws:context:usr:${user.userId}`);
				if (previousShowtimeIdRaw && Number(previousShowtimeIdRaw) !== Number(data.showtimeId)) {
					const prevShowtimeId = Number(previousShowtimeIdRaw);
					socket.leave(`showtime_${prevShowtimeId}`);

					await seatLockService.forceUnlockUserSeats(prevShowtimeId, user.userId);
				}

				const showtime = await (Database.repository('main', 'showtimes') as any).getById(data.showtimeId, {
					relations: [{ association: '_RoomBookings', nested: [{ association: '_Rooms' }] }],
				});

				const showtimeCinemaId = showtime?._RoomBookings?._Rooms?.cinema;

				if (!showtimeCinemaId || Number(showtimeCinemaId) !== Number(quoteData.cinema)) {
					Logger.warn(`[WS] join_showtime error - Sucursal inválida o no coincide (user: ${user.userId})`);
					RealtimeProvider.getInstance().emitToSocket(socket.id, 'join_error', {
						message: 'Función no válida para la sucursal actual o sesión expirada',
					});
					return;
				}

				socket.join(`showtime_${data.showtimeId}`);
				await redis.set(`ws:context:usr:${user.userId}`, String(data.showtimeId), 'EX', 3600);
				Logger.info(`[WS] join_showtime exitoso - user: ${user.userId}, showtimeId: ${data.showtimeId}`);
				RealtimeProvider.getInstance().emitToSocket(socket.id, 'join_success', { showtimeId: data.showtimeId });
			}
		});

		// Desuscripción a la sala
		RealtimeProvider.getInstance().registerEventHandler('leave_showtime', async (socket, data: any) => {
			const user = socket.data.session;
			Logger.info(`[WS] Accediendo a leave_showtime - user: ${user?.userId}, data: ${JSON.stringify(data)}`);
			if (!data?.showtimeId) return;
			socket.leave(`showtime_${data.showtimeId}`);

			if (user?.userId) {
				const redis = CacheDatabaseProvider.getInstance().client;
				await redis.del(`ws:context:usr:${user.userId}`);

				await seatLockService.forceUnlockUserSeats(data.showtimeId, user.userId);
				Logger.info(`[WS] leave_showtime exitoso - user: ${user.userId}, showtimeId: ${data.showtimeId}`);
			}
		});

		// Intento de bloquear un asiento
		RealtimeProvider.getInstance().registerEventHandler('lock_seat', async (socket, data: any) => {
			const user = socket.data.session;
			Logger.info(`[WS] Accediendo a lock_seat - user: ${user?.userId}, data: ${JSON.stringify(data)}`);
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

				await seatLockService.lockSeat(showtimeId, data.seatId, user.userId, socket.id);

				await redis.sadd(`usr:${user.userId}:showtime:${showtimeId}:locked_seats`, String(data.seatId));
				await redis.expire(`usr:${user.userId}:showtime:${showtimeId}:locked_seats`, 3600);

				Logger.info(`[WS] lock_seat exitoso - user: ${user.userId}, seatId: ${data.seatId}, showtimeId: ${showtimeId}`);
			} catch (err: any) {
				Logger.error(`[WS] lock_seat error - user: ${user.userId}: ${err.message}`, err);
				RealtimeProvider.getInstance().emitToSocket(socket.id, 'seat_lock_error', {
					message: err.message || 'Asiento ocupado',
					seatId: data.seatId,
				});
			}
		});

		// Intento de liberar un asiento
		RealtimeProvider.getInstance().registerEventHandler('unlock_seat', async (socket, data: any) => {
			const user = socket.data.session;
			Logger.info(`[WS] Accediendo a unlock_seat - user: ${user?.userId}, data: ${JSON.stringify(data)}`);
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

				const unlocked = await seatLockService.unlockSeat(showtimeId, data.seatId, user.userId);

				if (unlocked) {
					await redis.srem(`usr:${user.userId}:showtime:${showtimeId}:locked_seats`, String(data.seatId));
					Logger.info(`[WS] unlock_seat exitoso - user: ${user.userId}, seatId: ${data.seatId}, showtimeId: ${showtimeId}`);
				}
			} catch (err: any) {
				Logger.error(`[WS] unlock_seat error - user: ${user.userId}: ${err.message}`, err);
			}
		});
	}
}
