import { QueueProvider } from '../../shared/providers/queue.provider.js';
import { Logger } from '@utils/logger.util.js';
import { AppConfig } from '@config/app.config.js';

export default async function movieLifecycleCron() {
	try {
		const queueProvider = QueueProvider.getInstance();
		const { syncCron } = AppConfig.load().movieLifecycle;

		await queueProvider.add(
			'movie-lifecycle-queue',
			'sync-movie-lifecycle',
			{},
			{
				repeat: {
					pattern: syncCron,
					tz: AppConfig.load().movieLifecycle.timezone,
				},
				removeOnComplete: true,
				removeOnFail: true,
			},
		);

		Logger.info(`[movie-lifecycle-cron] Registrado con patrón ${syncCron}`);
	} catch (error: any) {
		Logger.error('Error al registrar el cron de ciclo de vida de películas:', error);
	}
}
