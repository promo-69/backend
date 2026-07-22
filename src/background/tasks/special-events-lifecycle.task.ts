import specialEventsLifecycleService from '@services/special-events-lifecycle.service.js';
import { Logger } from '@utils/logger.util.js';

export async function specialEventsLifecycleTask(): Promise<number> {
	const updated = await specialEventsLifecycleService.syncEventsLifecycle();
	Logger.info(`[special-events-lifecycle-task] Procesadas ${updated} eventos especiales actualizados.`);
	return updated;
}

export default specialEventsLifecycleTask;
