import { WorkerHandler } from '../handlers/worker.handler.js';
import { Logger } from '@utils/logger.util.js';
import { OrdersService } from '@modules/orders/_.service.js';
import { Job } from 'bullmq';

export default function orderExpirationWorker() {
	return WorkerHandler.create({
		queue: 'order-expiration-queue',
		task: async (job: Job) => {
			const { orderId, queueId } = job.data;
			if (!orderId) {
				Logger.warn(`Trabajo incompleto en order-expiration-queue para job ${job.id}`);
				return;
			}
			
			const ordersService = new OrdersService();
			await ordersService.expirePendingOrder(orderId, queueId);
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
