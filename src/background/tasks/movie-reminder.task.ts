import { Database } from '@database/index.js';
import { emailService } from '@services/email.service.js';
import { Logger } from '@utils/logger.util.js';
import { type MovieReminderType } from '@templates/emails/movie-reminder.template.js';

export async function movieReminderTask(movieId: number, reminderType: MovieReminderType): Promise<void> {
    const subscriptionsRepo = Database.repository('main', 'movie-user-subscriptions') as any;
    const moviesRepo = Database.repository('main', 'movies') as any;

    // 1. Obtener la película
    const movie = await moviesRepo.getById(movieId);
    if (!movie) {
        Logger.warn(`[movie-reminder] Película ${movieId} no encontrada. Se omite el envío.`);
        return;
    }

    // 2. Obtener todas las suscripciones activas para esta película,
    //    cargando el email de la cuenta y el nombre desde people.
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
                            attributes: ['first_name', 'last_name'],
                            required: true,
                            nested: [
                                {
                                    // El email vive en la tabla users, vinculada a person
                                    association: '_Customers',
                                    attributes: ['email'],
                                    required: false,
                                },
                            ],
                        },
                    ],
                },
            ],
        },
        { movie: movieId },
    );

    if (!subscriptions || subscriptions.length === 0) {
        Logger.info(
            `[movie-reminder] Sin suscriptores para película ${movieId} (tipo: ${reminderType}). Nada que enviar.`,
        );
        return;
    }

    // 3. Obtener emails directamente desde users, cruzando por person → customer
    //    La relación correcta es: subscriptions → customer → person → user.email
    const usersRepo = Database.repository('main', 'users') as any;

    const results = await Promise.allSettled(
        subscriptions.map(async (sub: any) => {
            const customer = sub._Customers;
            if (!customer?._People) return;

            const personId = customer.person;
            const firstName = customer._People.first_name ?? 'Cinéfilo';

            // Buscar el usuario (email de login) vinculado a esta persona
            const user = await usersRepo.getOne({ person: personId });
            if (!user?.email) {
                Logger.warn(`[movie-reminder] No se encontró email para persona ${personId}. Se omite.`);
                return;
            }

            await emailService.sendMovieReminderEmail(
                user.email,
                firstName,
                movie.title,
                movie.release_date,
                reminderType,
                movie.poster_url ?? undefined,
            );
        }),
    );

    const sent = results.filter((r) => r.status === 'fulfilled').length;
    const failed = results.filter((r) => r.status === 'rejected').length;

    Logger.info(
        `[movie-reminder] Película "${movie.title}" (${reminderType}): ${sent} correos enviados, ${failed} fallidos de ${subscriptions.length} suscriptores.`,
    );
}
