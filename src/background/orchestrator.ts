import { Logger } from '@utils/logger.util.js';
import { ANSI } from '@utils/ansi.util.js';

export async function startBackgroundProcesses(): Promise<void> {
	try {
		Logger.info(ANSI.info('[Background] Starting background auto-discovery...'));

		const subscribers = import.meta.glob('./subscribers/*.subscriber.{ts,js}', { eager: true }) as Record<
			string,
			any
		>;
		for (const path in subscribers) {
			const initFn = subscribers[path].default;
			if (typeof initFn === 'function') {
				await initFn();
				Logger.info(ANSI.success(`[Background] Loaded subscriber: ${path}`));
			}
		}

		const workers = import.meta.glob('./workers/*.worker.{ts,js}', { eager: true }) as Record<string, any>;
		for (const path in workers) {
			const initFn = workers[path].default;
			if (typeof initFn === 'function') {
				await initFn();
				Logger.info(ANSI.success(`[Background] Loaded worker: ${path}`));
			}
		}

		const jobs = import.meta.glob('./jobs/*.job.{ts,js}', { eager: true }) as Record<string, any>;
		for (const path in jobs) {
			const initFn = jobs[path].default;
			if (typeof initFn === 'function') {
				await initFn();
				Logger.info(ANSI.success(`[Background] Loaded job: ${path}`));
			}
		}

		Logger.natural(ANSI.success('[+] Background processes successfully initialized.'));
	} catch (error: any) {
		Logger.error('[Background] Failed to start background processes:', error);
	}
}
