import movieLifecycleService from '@services/movie-lifecycle.service.js';
import { Logger } from '@utils/logger.util.js';

export async function movieLifecycleTask(): Promise<number> {
	const updated = await movieLifecycleService.syncMoviesLifecycle();
	Logger.info(`[movie-lifecycle-task] Procesadas ${updated} películas actualizadas.`);
	return updated;
}

export default movieLifecycleTask;
