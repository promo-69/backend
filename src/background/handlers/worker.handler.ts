import { Worker, Job, WorkerOptions } from 'bullmq';
import { CacheDatabaseProvider } from '@providers/cache-database.provider.js';
import { Logger } from '@utils/logger.util.js';

export interface WorkerHandlerConfig {
	queue: string;
	task: (job: Job) => Promise<any>;
	on?: {
		failed?: (job: Job | undefined, error: Error) => void;
		completed?: (job: Job, result: any) => void;
	};
	options?: Omit<WorkerOptions, 'connection'>;
}

export class WorkerHandler {
	static create(config: WorkerHandlerConfig): Worker {
		const connection = CacheDatabaseProvider.getInstance().client as any;

		const workerOptions: WorkerOptions = {
			connection,
			...(config.options || {}),
		};

		const worker = new Worker(
			config.queue,
			async (job: Job) => {
				Logger.info(`[WorkerHandler] Iniciando ejecución de tarea "${job.name}" de la cola "${config.queue}"`);

				return await config.task(job);
			},
			workerOptions,
		);

		if (config.on?.completed) worker.on('completed', config.on.completed);

		if (config.on?.failed) worker.on('failed', config.on.failed);

		return worker;
	}
}
