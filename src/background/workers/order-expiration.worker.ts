import { WorkerHandler } from '../handlers/worker.handler.js';
import { Logger } from '@utils/logger.util.js';
import { orderExpirationTask } from '../tasks/order-expiration.task.js';
import { Job } from 'bullmq';

export default function orderExpirationWorker() {
	return WorkerHandler.create({
		queue: 'order-expiration-queue',
		task: async (job: Job) => {
			const { orderId, userId } = job.data;
			if (!orderId) {
				Logger.warn(`Trabajo incompleto en order-expiration-queue para job ${job.id}`);
				return;
			}
			
			await orderExpirationTask(orderId, userId);
		},
		on: {
			failed: (job, err) => {
				Logger.error(`Worker falló en order-expiration-queue para el trabajo "${job?.id}"`, err);
			},
			completed: (job) => {
				Logger.info(`Tarea de expiración de orden "${job.id}" para la orden "${job.data.orderId}" completada`);
			},
		},
	});
}
