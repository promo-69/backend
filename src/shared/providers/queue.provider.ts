import { type JobsOptions, Queue } from 'bullmq';
import { CacheDatabaseProvider } from '@providers/cache-database.provider.js';
import { AppConfig } from '@config/app.config.js';

export class QueueProvider {
    private static _instance: QueueProvider;
    private queues: Map<string, Queue> = new Map();

    private constructor() {}

    static getInstance(): QueueProvider {
        if (AppConfig.isProduction()) {
            if (!this._instance) this._instance = new QueueProvider();
            return this._instance;
        }

        const QUEUE_PROVIDER_SYMBOL = Symbol.for('global.queue.provider');
        const globalWithQueue = globalThis as typeof globalThis & {
            [QUEUE_PROVIDER_SYMBOL]: QueueProvider;
        };

        if (!globalWithQueue[QUEUE_PROVIDER_SYMBOL]) {
            globalWithQueue[QUEUE_PROVIDER_SYMBOL] = new QueueProvider();
        }

        return globalWithQueue[QUEUE_PROVIDER_SYMBOL];
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

    async add<T = any>(queueName: string, taskName: string, data: T, options?: JobsOptions) {
        const queue = this.getQueue(queueName);

        return await queue.add(taskName, data, options);
    }
}

// Limpieza para Vite HMR
if (import.meta.hot) {
    import.meta.hot.dispose(async () => {
        const provider = QueueProvider.getInstance();
        // @ts-ignore
        for (const queue of provider.queues.values()) {
            await queue.close();
        }
    });
}
