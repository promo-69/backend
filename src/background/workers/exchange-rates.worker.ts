import { WorkerHandler } from '../handlers/worker.handler.js';
import { Job } from 'bullmq';
import { Logger } from '@utils/logger.util.js';
import { ExchangeRateService } from '@services/exchange-rates.service.js';

export default function ExchangeRateWorker() {
	return WorkerHandler.create({
		queue: 'exchange-rates-update-queue',
		task: async (job: Job) => {
			await ExchangeRateService.fetchExchangeRates();
		},
		on: {
			failed: (job, err) => {
				Logger.error(`Worker falló en exchange-rates-update para el trabajo "${job?.id}"`, err);
			},
			completed: (job, result) => {
				Logger.info(`Tarea de exchange-rates-update "${job.id}" completada con éxito.`);
			},
		},
	});
}
