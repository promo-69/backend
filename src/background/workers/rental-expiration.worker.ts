import { WorkerHandler } from '../handlers/worker.handler.js';
import { Logger } from '@utils/logger.util.js';
import RentalManagementService from '@services/rental-management.service.js';
import { Job } from 'bullmq';

export default function rentalExpirationWorker() {
    return WorkerHandler.create({
        queue: 'rental-expiration-queue',
        task: async (job: Job) => {
            const { rentalRequestId, bookingId } = job.data;

            if (!rentalRequestId) {
                Logger.warn(`[rental-expiration-worker] Job ${job.id} sin rentalRequestId — ignorado`);
                return;
            }

            await RentalManagementService.expireProforma(rentalRequestId, bookingId ?? null);
        },
        on: {
            completed: (job) => {
                Logger.info(
                    `[rental-expiration-worker] Proforma de alquiler #${job.data.rentalRequestId} procesada (job ${job.id})`,
                );
            },
            failed: (job, err) => {
                Logger.error(
                    `[rental-expiration-worker] Falló job ${job?.id} para solicitud #${job?.data?.rentalRequestId}`,
                    err,
                );
            },
        },
    });
}
