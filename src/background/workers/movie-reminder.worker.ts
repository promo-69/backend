import { WorkerHandler } from '../handlers/worker.handler.js';
import { Logger } from '@utils/logger.util.js';
import { movieReminderTask } from '../tasks/movie-reminder.task.js';
import { Job } from 'bullmq';

export default function movieReminderWorker() {
    return WorkerHandler.create({
        queue: 'movie-reminder-queue',
        task: async (job: Job) => {
            const { movieId, reminderType } = job.data;

            if (!movieId || !reminderType) {
                Logger.warn(`[movie-reminder-worker] Trabajo incompleto en movie-reminder-queue para job ${job.id}`);
                return;
            }

            await movieReminderTask(movieId, reminderType);
        },
        on: {
            failed: (job, err) => {
                Logger.error(
                    `[movie-reminder-worker] Worker falló en movie-reminder-queue para el trabajo "${job?.id}" (película: ${job?.data?.movieId}, tipo: ${job?.data?.reminderType})`,
                    err,
                );
            },
            completed: (job) => {
                Logger.info(
                    `[movie-reminder-worker] Trabajo "${job.id}" completado — película: ${job.data.movieId}, tipo: ${job.data.reminderType}`,
                );
            },
        },
    });
}
