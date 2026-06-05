import { CacheDatabaseProvider } from '@providers/cache-database.provider.js';
import { Database } from '@database/index.js';
import { RealtimeProvider } from '@providers/realtime.provider.js';
import { Logger } from '@utils/logger.util.js';
import { Transaction } from 'sequelize';

export class ShoppingSessionService {
	private get _redis() {
		return CacheDatabaseProvider.getInstance().client;
	}

	private get _orders() {
		return Database.repository('main', 'orders') as any;
	}

	private get _tickets() {
		return Database.repository('main', 'tickets') as any;
	}

	async cancelShoppingSession(session: any) {
		const userQueueKey = `queue:usr:${session.userId}`;
		await this._redis.del(userQueueKey);

		const customerId = Number(session.customerId);

		// Cancela cualquier orden pendiente de este usuario
		const pendingOrders = await this._orders.getAll({ count: false }, { customer: customerId, order_status: 1 });

		for (const order of pendingOrders) {
			await this._orders.update({ id: order.id }, { order_status: 3 });
			await this._tickets.delete({ order: order.id });
		}

		// Libera todos los asientos bloqueados por este usuario en Redis
		const lockKeys = await this._redis.keys('lock:showtime:*:seat:*');
		for (const lockKey of lockKeys) {
			const lockedUserId = await this._redis.get(lockKey);
			if (lockedUserId === String(session.userId)) {
				await this._redis.del(lockKey);
				const parts = lockKey.split(':');
				if (parts.length >= 5) {
					const showtimeId = parts[2];
					const seatId = parts[4];
					RealtimeProvider.getInstance().emitToRoom(`showtime_${showtimeId}`, 'seats_unlocked', {
						seatIds: [Number(seatId)],
					});
				}
			}
		}

		return { message: 'Sesión de compra cancelada exitosamente' };
	}

	async expirePendingOrder(orderId: number, queueId: string) {
		await this._orders.transaction(async (transaction: Transaction) => {
			const order = await this._orders.getOne({ id: orderId }, { transaction, lock: transaction.LOCK.UPDATE });

			if (order && order.order_status === 1) {
				await this._orders.update({ id: orderId }, { order_status: 3 }, { transaction }); // Cancelado

				// Requerimos los tickets para liberar los asientos masivamente
				const tickets = await this._tickets.getAll(
					{
						count: false,
						relations: [{ association: '_RoomBookings', nested: [{ association: '_Showtimes' }] }],
					},
					{ order: orderId },
					{ transaction },
				);

				await this._tickets.delete({ order: orderId }, { transaction });

				Logger.info(` Orden ${orderId} expiró y fue cancelada.`);
				RealtimeProvider.getInstance().emitToRoom(`queue_${queueId}`, 'order_expired', { orderId });

				const uniqueShowtimes = new Set<number>();
				const ticketsByShowtime = new Map<number, number[]>();
				for (const t of tickets) {
					let showtimeId = null;
					if (t._RoomBookings && t._RoomBookings._Showtimes) {
						const st = Array.isArray(t._RoomBookings._Showtimes)
							? t._RoomBookings._Showtimes[0]
							: t._RoomBookings._Showtimes;
						showtimeId = st?.id;
					}
					if (showtimeId) {
						uniqueShowtimes.add(showtimeId);
						if (!ticketsByShowtime.has(showtimeId)) ticketsByShowtime.set(showtimeId, []);
						ticketsByShowtime.get(showtimeId)!.push(t.seat);
					}
				}

				for (const showtimeId of uniqueShowtimes) {
					RealtimeProvider.getInstance().emitToRoom(`showtime_${showtimeId}`, 'seats_unlocked', {
						seatIds: ticketsByShowtime.get(showtimeId),
					});
				}
			}
		});
	}
}
