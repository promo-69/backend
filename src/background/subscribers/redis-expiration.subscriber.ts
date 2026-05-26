import { CacheDatabaseProvider } from '@providers/cache-database.provider.js';
import { Logger } from '@utils/logger.util.js';
import { OrdersService } from '@modules/orders/_.service.js';

export default async function redisExpirationSubscriber() {
	const redisClient = CacheDatabaseProvider.getInstance().client;
	const subscriber = redisClient.duplicate();

	// Habilitar notificaciones de expiración en Redis (Ex)
	try {
		await redisClient.config('SET', 'notify-keyspace-events', 'Ex');
	} catch (error) {
		Logger.warn(`[Redis Expiration] No se pudo configurar notify-keyspace-events de forma automática. Asegúrese de que esté habilitado en redis.conf`);
	}

	const ordersService = new OrdersService();

	subscriber.on('message', (channel, message) => {
		// message es el nombre de la key expirada
		if (message.startsWith('queue:usr:')) {
			const parts = message.split(':');
			// queue:usr:{user_id}:id:{queue_id}
			const userId = Number(parts[2]);
			const queueId = parts[4];
			
			if (queueId && userId) {
				Logger.info(`[Redis Expiration] Sesión de compra expirada: queue_id=${queueId}`);
				ordersService.handleQuoteExpiration(queueId, userId).catch((err: any) => {
					Logger.error(`Error manejando expiración de quote ${queueId}:`, err);
				});
			}
		} else if (message.startsWith('lock:showtime:')) {
			// lock:showtime:{showtimeId}:seat:{seatId}
			const parts = message.split(':');
			const showtimeId = Number(parts[2]);
			const seatId = Number(parts[4]);
			
			if (showtimeId && seatId) {
				Logger.info(`[Redis Expiration] Butaca liberada por TTL: showtime=${showtimeId}, seat=${seatId}`);
				ordersService.handleSeatExpiration(showtimeId, seatId, '').catch((err: any) => {
					Logger.error(`Error manejando expiración de asiento ${seatId}:`, err);
				});
			}
		}
	});

	await subscriber.subscribe('__keyevent@0__:expired');
	Logger.info('[Subscriber] Escuchando expiraciones de llaves en Redis (__keyevent@0__:expired)');
}
