import { Queue } from 'bullmq';
import { CacheDatabaseProvider } from '@providers/cache-database.provider.js';

export class QueueProvider {
	private static instance: QueueProvider;
	private queues: Map<string, Queue> = new Map();

	private constructor() {}

	static getInstance(): QueueProvider {
		if (!QueueProvider.instance) QueueProvider.instance = new QueueProvider();

		return QueueProvider.instance;
	}

	getQueue(name: string): Queue {
		if (!this.queues.has(name)) {
			const cacheProvider = CacheDatabaseProvider.getInstance();
			const queue = new Queue(name, {
				connection: cacheProvider.client as any,
				defaultJobOptions: {
					attempts: 3,
					backoff: {
						type: 'exponential',
						delay: 1000,
					},
				},
			});
			this.queues.set(name, queue);
		}

		return this.queues.get(name)!;
	}
}
