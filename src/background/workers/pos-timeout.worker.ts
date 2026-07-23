import { WorkerHandler } from '../handlers/worker.handler.js';
import { Logger } from '@utils/logger.util.js';
import { posTimeoutTask } from '../tasks/pos-timeout.task.js';
import { Job } from 'bullmq';

export default function posTimeoutWorker() {
	return WorkerHandler.create({
		queue: 'pos-timeout-queue',
		task: async (job: Job) => {
			const { ticketId, userId, orderId } = job.data;
			if (!ticketId || !userId || !orderId) {
				Logger.warn(`Trabajo incompleto en pos-timeout-queue para job ${job.id}`);
				return;
			}
			
			await posTimeoutTask(ticketId, userId, orderId);
		},
		on: {
			failed: (job, err) => {
				Logger.error(`Worker falló en pos-timeout-queue para el trabajo "${job?.id}"`, err);
			},
			completed: (job) => {
				Logger.info(`Timeout check completado para ticket POS "${job.data.ticketId}"`);
			},
		},
	});
}
