import { WorkerHandler } from '../handlers/worker.handler.js';
import { Job } from 'bullmq';
import { Logger } from '@utils/logger.util.js';
import { signupVerificationTask } from '../tasks/signup-verification.task.js';

export default function signupVerificationWorker() {
	return WorkerHandler.create({
		queue: 'signup-verification-queue',
		task: async (job: Job) => {
			const { email, userId, personId } = job.data;
			if (!userId || !personId) {
				Logger.warn(`Trabajo incompleto en signup-verification-queue para job ${job.id}`);
				return;
			}

			await signupVerificationTask(userId, personId);
		},
		on: {
			failed: (job, err) => {
				Logger.error(`Worker falló en signup-verification-queue para el trabajo "${job?.id}"`, err);
			},
			completed: (job) => {
				Logger.info(`Tarea de limpieza "${job.id}" para el usuario "${job.data.email}" completada`);
			},
		},
	});
}
