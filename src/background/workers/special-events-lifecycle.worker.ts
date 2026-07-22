import { WorkerHandler } from '../handlers/worker.handler.js';
import { Logger } from '@utils/logger.util.js';
import { specialEventsLifecycleTask } from '../tasks/special-events-lifecycle.task.js';
import { Job } from 'bullmq';

export default function specialEventsLifecycleWorker() {
	return WorkerHandler.create({
		queue: 'special-events-lifecycle-queue',
		task: async (job: Job) => {
			await specialEventsLifecycleTask();
			return { jobId: job.id };
		},
		on: {
			failed: (job, err) => {
				Logger.error(`Worker falló en special-events-lifecycle-queue para el trabajo "${job?.id}"`, err);
			},
			completed: (job) => {
				Logger.info(`Tarea de ciclo de vida de eventos especiales "${job.id}" completada exitosamente.`);
			},
		},
	});
}
