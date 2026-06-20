import { QueueProvider } from '../../shared/providers/queue.provider.js';
import { Logger } from '@utils/logger.util.js';

export default async function movieRemindersCron() {
	try {
		const queueProvider = QueueProvider.getInstance();

		// '0 9 * * *' significa: a las 09:00am de cada día.
		await queueProvider.add(
			'movie-reminders-queue',
			'check-movie-reminders',
			{},
			{
				repeat: {
					pattern: '0 9 * * *',
					tz: 'America/Caracas',
				},
				removeOnComplete: true,
				removeOnFail: true,
			},
		);

		Logger.info('Cron de recordatorios de películas registrado exitosamente para ejecutarse a las 09:00 de cada día.');
	} catch (error: any) {
		Logger.error('Error al registrar el cron de recordatorios de películas:', error);
	}
}
