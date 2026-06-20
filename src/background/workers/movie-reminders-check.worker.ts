import { WorkerHandler } from '../handlers/worker.handler.js';
import { Logger } from '@utils/logger.util.js';
import { runMovieRemindersCheck } from '../crons/movie-reminders.cron.js';
import { Job } from 'bullmq';

export default function movieRemindersCheckWorker() {
    return WorkerHandler.create({
        queue: 'movie-reminders-check-queue',
        task: async (_job: Job) => {
            await runMovieRemindersCheck();
        },
        on: {
            failed: (job, err) => {
                Logger.error(
                    `[movie-reminders-check-worker] Falló el chequeo diario de recordatorios (job: ${job?.id})`,
                    err,
                );
            },
            completed: (job) => {
                Logger.info(`[movie-reminders-check-worker] Chequeo diario "${job.id}" completado exitosamente.`);
            },
        },
    });
}
