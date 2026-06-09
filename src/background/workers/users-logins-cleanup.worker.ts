import { WorkerHandler } from '../handlers/worker.handler.js';
import { Job } from 'bullmq';
import { Database } from '@database/index.js';
import { Logger } from '@utils/logger.util.js';
import { Op } from 'sequelize';

import { cleanUpExpiredLoginsTask } from '../tasks/users-logins-cleanup.task.js';

export default function usersLoginsCleanupWorker() {
	return WorkerHandler.create({
		queue: 'users-logins-cleanup-queue',
		task: async (job: Job) => {
			await cleanUpExpiredLoginsTask();
		},
		on: {
			failed: (job, err) => {
				Logger.error(`Worker falló en users-logins-cleanup-queue para el trabajo "${job?.id}"`, err);
			},
			completed: (job, result) => {
				Logger.info(
					`Tarea de limpieza de logins expirados "${job.id}" completada. Registros eliminados: ${result || 0}`,
				);
			},
		},
	});
}
