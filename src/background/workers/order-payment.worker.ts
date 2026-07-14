import { WorkerHandler } from '../handlers/worker.handler.js';
import { Logger } from '@utils/logger.util.js';
import { processOrderPaymentTask } from '../tasks/order-payment.task.js';
import { Job } from 'bullmq';

export default function orderPaymentWorker() {
	return WorkerHandler.create({
		queue: 'order-payment-queue',
		task: async (job: Job) => {
			const { body, session } = job.data;
			if (!body || !session) {
				Logger.warn(`Trabajo incompleto en order-payment-queue para job ${job.id}`);
				return;
			}
			
			await processOrderPaymentTask(body, session);
		},
		on: {
			failed: (job, err) => {
				Logger.error(`Worker falló en order-payment-queue para el trabajo "${job?.id}"`, err);
			},
			completed: (job) => {
				Logger.info(`Procesamiento de pago completado para job "${job.id}"`);
			},
		},
	});
}
