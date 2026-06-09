import { QueueProvider } from '../../shared/providers/queue.provider.js';
import { Logger } from '@utils/logger.util.js';

export default async function usersLoginsCleanupCron() {
	try {
		const queueProvider = QueueProvider.getInstance();

		// Agrega un trabajo repetitivo que se ejecuta todos los días a la 1:00 AM
		// El patrón CRON '0 1 * * *' significa: minuto 0, hora 1, cualquier día del mes, cualquier mes, cualquier día de la semana.
		await queueProvider.add(
			'users-logins-cleanup-queue',
			'cleanup-expired-logins',
			{},
			{
				repeat: {
					pattern: '0 1 * * *',
				},
				// Evita que trabajos repetitivos antiguos se acumulen
				removeOnComplete: true,
				removeOnFail: true,
			},
		);

		Logger.info(
			'Cron de limpieza de logins expirados registrado exitosamente para ejecutarse a la 1:00 AM diariamente.',
		);
	} catch (error: any) {
		Logger.error('Error al registrar el cron de limpieza de logins expirados:', error);
	}
}
