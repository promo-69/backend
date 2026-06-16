import { QueueProvider } from '../../shared/providers/queue.provider.js';
import { Logger } from '@utils/logger.util.js';

export default async function exchangeRatesCron() {
	try {
		const queueProvider = QueueProvider.getInstance();

		// Agregamos el trabajo que se ejecuta todos los días a intervalos regulares.
		// El patrón CRON '0 18 * * *' significa: a las 18:00 de cada día.
		await queueProvider.add(
			'exchange-rates-update-queue',
			'update-exchange-rates',
			{},
			{
				repeat: {
					pattern: '0 18 * * *',
					tz: 'America/Caracas',
				},
				// Evita que trabajos repetitivos antiguos se acumulen
				removeOnComplete: true,
				removeOnFail: true,
			},
		);

		Logger.info('Cron de actualización de tasas registrado exitosamente para ejecutarse a las 18:00 de cada día.');
	} catch (error: any) {
		Logger.error('Error al registrar el cron de actualización de tasas:', error);
	}
}
