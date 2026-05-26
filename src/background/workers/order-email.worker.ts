import { WorkerHandler } from '../handlers/worker.handler.js';
import { Logger } from '@utils/logger.util.js';
import { emailService } from '@services/email.service.js';
import { Job } from 'bullmq';

export default function orderEmailWorker() {
	return WorkerHandler.create({
		queue: 'order-email-queue',
		task: async (job: Job) => {
			const { orderId, qrCode, email } = job.data;
			if (!orderId || !email) {
				Logger.warn(`Trabajo incompleto en order-email-queue para job ${job.id}`);
				return;
			}
			
			await emailService.sendOrderInvoiceEmail(email, orderId, qrCode);
		},
		on: {
			failed: (job, err) => {
				Logger.error(`Worker falló en order-email-queue para el trabajo "${job?.id}"`, err);
			},
			completed: (job) => {
				Logger.info(`Envío de correo "${job.id}" para la orden "${job.data.orderId}" completado`);
			},
		},
	});
}
