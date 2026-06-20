import { QueueProvider } from '../../shared/providers/queue.provider.js';
import { Database } from '@database/index.js';
import { Logger } from '@utils/logger.util.js';
import { type MovieReminderType } from '@templates/emails/movie-reminder.template.js';

/**
 * Cron diario que revisa qué películas/eventos especiales deben generar
 * un correo recordatorio para sus suscriptores.
 *
 * Criterios de disparo (basados en release_date):
 *   - 'presale'  → lifecycle_state = 1 (preventa activa, ~1 semana antes del estreno)
 *   - '3_weeks'  → exactamente 21 días antes de release_date
 *   - '2_weeks'  → exactamente 14 días antes de release_date
 *   - '1_week'   → exactamente  7 días antes de release_date
 *   - '2_days'   → exactamente  2 días antes de release_date
 *
 * Se ejecuta todos los días a las 09:00 hora Venezuela.
 */
export default async function movieRemindersCron() {
    try {
        const queueProvider = QueueProvider.getInstance();

        await queueProvider.add(
            'movie-reminders-check-queue',
            'check-movie-reminders',
            {},
            {
                repeat: {
                    pattern: '0 9 * * *',
                    tz: 'America/Caracas',
                },
                removeOnComplete: true,
                removeOnFail: true,
            },
        );

        Logger.info(
            '[movie-reminders-cron] Cron de recordatorios de películas registrado para ejecutarse a las 09:00 VET.',
        );
    } catch (error: any) {
        Logger.error('[movie-reminders-cron] Error al registrar el cron de recordatorios:', error);
    }
}

/**
 * Calcula la diferencia en días entre hoy y una fecha dada.
 * Devuelve un número positivo si la fecha está en el futuro.
 */
function daysUntil(date: Date): number {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(date);
    target.setHours(0, 0, 0, 0);
    return Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

/**
 * Determina qué tipo de recordatorio (si alguno) le corresponde
 * a una película en función de los días que faltan para su estreno
 * y su lifecycle_state actual.
 */
function resolveReminderType(releaseDate: Date, lifecycleState: number): MovieReminderType | null {
    const days = daysUntil(releaseDate);

    // Preventa: la película está en estado 1 (upcoming/preventa activa)
    if (lifecycleState === 1) return 'presale';

    // Recordatorios basados en días exactos antes del estreno
    if (days === 21) return '3_weeks';
    if (days === 14) return '2_weeks';
    if (days === 7) return '1_week';
    if (days === 2) return '2_days';

    return null;
}

/**
 * Punto de entrada llamado por el worker del cron check.
 * Consulta películas candidatas y encola un job de envío por cada una.
 */
export async function runMovieRemindersCheck(): Promise<void> {
    const moviesRepo = Database.repository('main', 'movies') as any;
    const queueProvider = QueueProvider.getInstance();

    // Traemos películas en estados 1 (upcoming/preventa) o cuya release_date
    // esté entre hoy y 22 días en el futuro (cubre todos los umbrales).
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const horizon = new Date(today);
    horizon.setDate(horizon.getDate() + 22);

    // Sequelize Ops se importa desde el índice del database
    const { Ops } = await import('@database/index.js');

    const { rows: movies } = await moviesRepo.getAll(
        { count: true },
        {
            release_date: { [Ops.between]: [today.toISOString(), horizon.toISOString()] },
            deleted_at: null,
        },
    );

    if (!movies || movies.length === 0) {
        Logger.info('[movie-reminders-cron] Sin películas candidatas para recordatorios hoy.');
        return;
    }

    let enqueued = 0;

    for (const movie of movies) {
        const reminderType = resolveReminderType(new Date(movie.release_date), movie.lifecycle_state);

        if (!reminderType) continue;

        // Verificar que la película tenga suscriptores antes de encolar
        const subscriptionsRepo = Database.repository('main', 'movie-user-subscriptions') as any;
        const count = await subscriptionsRepo.count({ movie: movie.id });
        if (!count || count === 0) continue;

        await queueProvider.add(
            'movie-reminder-queue',
            `reminder-movie-${movie.id}-${reminderType}`,
            { movieId: movie.id, reminderType },
            {
                // Evitamos duplicados si el cron se dispara más de una vez en el día
                jobId: `reminder-${movie.id}-${reminderType}-${today.toISOString().slice(0, 10)}`,
                removeOnComplete: true,
                removeOnFail: false,
            },
        );

        enqueued++;
        Logger.info(
            `[movie-reminders-cron] Encolado recordatorio "${reminderType}" para película "${movie.title}" (id: ${movie.id}).`,
        );
    }

    Logger.info(`[movie-reminders-cron] Chequeo diario finalizado. ${enqueued} job(s) encolados.`);
}
