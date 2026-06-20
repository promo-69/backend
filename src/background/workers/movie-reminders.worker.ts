import { WorkerHandler } from '../handlers/worker.handler.js';
import { Logger } from '@utils/logger.util.js';
import { movieRemindersTask } from '../tasks/movie-reminders.task.js';
import { Job } from 'bullmq';

export default function movieRemindersWorker() {
    return WorkerHandler.create({
        queue: 'movie-reminders-queue',
        task: async (job: Job) => {
            await movieRemindersTask();
        },
        on: {
            failed: (job, err) => {
                Logger.error(`Worker falló en movie-reminders-queue para el trabajo "${job?.id}"`, err);
            },
            completed: (job) => {
                Logger.info(`Tarea de recordatorios de películas "${job.id}" completada exitosamente.`);
            },
        },
    });
}
