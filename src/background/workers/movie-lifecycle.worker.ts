import { WorkerHandler } from '../handlers/worker.handler.js';
import { Logger } from '@utils/logger.util.js';
import { movieLifecycleTask } from '../tasks/movie-lifecycle.task.js';
import { Job } from 'bullmq';

export default function movieLifecycleWorker() {
	return WorkerHandler.create({
		queue: 'movie-lifecycle-queue',
		task: async (job: Job) => {
			await movieLifecycleTask();
			return { jobId: job.id };
		},
		on: {
			failed: (job, err) => {
				Logger.error(`Worker falló en movie-lifecycle-queue para el trabajo "${job?.id}"`, err);
			},
			completed: (job) => {
				Logger.info(`Tarea de ciclo de vida de películas "${job.id}" completada exitosamente.`);
			},
		},
	});
}
