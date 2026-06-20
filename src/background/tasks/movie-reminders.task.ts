import { Database } from '@database/index.js';
import { emailService } from '@services/email.service.js';
import { Logger } from '@utils/logger.util.js';
import { Ops } from '@database/index.js';

/**
 * Revisa qué películas requieren un correo recordatorio hoy y hace el envío
 * masivo a todos sus suscriptores.
 *
 * Umbrales de disparo:
 *   - lifecycle_state = 1  → preventa activa
 *   - 21 días antes        → 3 semanas
 *   - 14 días antes        → 2 semanas
 *   -  7 días antes        → 1 semana
 *   -  2 días antes        → 2 días
 */
export async function movieRemindersTask(): Promise<void> {
    const moviesRepo = Database.repository('main', 'movies') as any;
    const subscriptionsRepo = Database.repository('main', 'movie-user-subscriptions') as any;
    const usersRepo = Database.repository('main', 'users') as any;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Fechas exactas que nos interesan hoy
    const in2Days = new Date(today);
    in2Days.setDate(today.getDate() + 2);
    const in7Days = new Date(today);
    in7Days.setDate(today.getDate() + 7);
    const in14Days = new Date(today);
    in14Days.setDate(today.getDate() + 14);
    const in21Days = new Date(today);
    in21Days.setDate(today.getDate() + 21);

    const toDateStr = (d: Date) => d.toISOString().slice(0, 10);

    // Películas en preventa (lifecycle_state = 1)
    const { rows: presaleMovies } = await moviesRepo.getAll({ count: true }, { lifecycle_state: 1, deleted_at: null });

    // Películas cuya release_date cae exactamente en uno de los umbrales
    const { rows: upcomingMovies } = await moviesRepo.getAll(
        { count: true },
        {
            release_date: {
                [Ops.in]: [toDateStr(in2Days), toDateStr(in7Days), toDateStr(in14Days), toDateStr(in21Days)],
            },
            deleted_at: null,
        },
    );

    // Unión deduplicada
    const allMovies: any[] = [...presaleMovies];
    for (const movie of upcomingMovies) {
        if (!allMovies.find((m) => m.id === movie.id)) allMovies.push(movie);
    }

    if (allMovies.length === 0) {
        Logger.info('[movie-reminders-task] Sin películas candidatas para recordatorios hoy.');
        return;
    }

    for (const movie of allMovies) {
        // Determinar qué tipo de recordatorio corresponde
        let reminderType: string;
        if (movie.lifecycle_state === 1) {
            reminderType = 'presale';
        } else {
            const releaseStr = toDateStr(new Date(movie.release_date));
            if (releaseStr === toDateStr(in21Days)) reminderType = '3_weeks';
            else if (releaseStr === toDateStr(in14Days)) reminderType = '2_weeks';
            else if (releaseStr === toDateStr(in7Days)) reminderType = '1_week';
            else if (releaseStr === toDateStr(in2Days)) reminderType = '2_days';
            else continue;
        }

        // Obtener suscriptores de esta película
        const { rows: subscriptions } = await subscriptionsRepo.getAll(
            {
                count: true,
                attributes: ['id', 'customer'],
                relations: [
                    {
                        association: '_Customers',
                        attributes: ['id', 'person'],
                        required: true,
                        nested: [
                            {
                                association: '_People',
                                attributes: ['first_name'],
                                required: true,
                            },
                        ],
                    },
                ],
            },
            { movie: movie.id },
        );

        if (!subscriptions || subscriptions.length === 0) continue;

        // Enviar correo a cada suscriptor
        const results = await Promise.allSettled(
            subscriptions.map(async (sub: any) => {
                const customer = sub._Customers;
                if (!customer?._People) return;

                const user = await usersRepo.getOne({ person: customer.person });
                if (!user?.email) return;

                await emailService.sendMovieReminderEmail(
                    user.email,
                    customer._People.first_name ?? 'Cinéfilo',
                    movie.title,
                    movie.release_date,
                    reminderType as any,
                    movie.poster_url ?? undefined,
                );
            }),
        );

        const sent = results.filter((r) => r.status === 'fulfilled').length;
        const failed = results.filter((r) => r.status === 'rejected').length;

        Logger.info(
            `[movie-reminders-task] "${movie.title}" (${reminderType}): ${sent} enviados, ${failed} fallidos de ${subscriptions.length} suscriptores.`,
        );
    }
}
