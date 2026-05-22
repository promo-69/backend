import { Logger } from '@utils/logger.util.js';
import { ANSI } from '@utils/ansi.util.js';

export async function startBackgroundProcesses(): Promise<void> {
	const manageInit = async (initFn: Function, path: string) => {
		if (typeof initFn !== 'function' || typeof path !== 'string') return;

		const processFileName = path.split('/');

		try {
			await initFn();
			Logger.natural(ANSI.success(`Loaded: ${processFileName[processFileName.length - 1]}`));
		} catch (error: any) {
			Logger.natural(ANSI.error(`Loaded: ${processFileName[processFileName.length - 1]}`));
		}
	};

	try {
		const promises = [];

		const subscribers = import.meta.glob(['./subscribers/*.subscriber.{ts,js}', '!./subscribers/__*.{ts,js}'], {
			eager: true,
		}) as Record<string, any>;
		for (const path in subscribers) promises.push(manageInit(subscribers[path].default, path));

		const workers = import.meta.glob(['./workers/*.worker.{ts,js}', '!./workers/__*.{ts,js}'], {
			eager: true,
		}) as Record<string, any>;
		for (const path in workers) promises.push(manageInit(workers[path].default, path));

		const crons = import.meta.glob(['./crons/*.cron.{ts,js}', '!./crons/__*.{ts,js}'], { eager: true }) as Record<
			string,
			any
		>;
		for (const path in crons) promises.push(manageInit(crons[path].default, path));

		await Promise.all(promises);

		if (promises.length == 0) Logger.natural('-');
	} catch (error: any) {
		Logger.error('Failed to start background processes:', error);
	}
}
