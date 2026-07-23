import { EmailLayout, SectionTitle, colors } from '../components/email.template.js';

export type MovieReminderType =
    | 'presale' // Disponible para preventa (lifecycle_state 1)
    | '3_weeks' // Faltan 3 semanas
    | '2_weeks' // Faltan 2 semanas
    | '1_week' // Falta 1 semana
    | '2_days'; // Faltan 2 días

const reminderMessages: Record<MovieReminderType, { headline: string; body: string; cta: string }> = {
    presale: {
        headline: '¡Ya puedes comprar tus entradas!',
        body: 'Las entradas para <strong>{title}</strong> ya están disponibles para preventa. ¡No te quedes sin el tuyo y elige tu asiento favorito antes que los demás!',
        cta: 'Comprar en Preventa',
    },
    '3_weeks': {
        headline: 'Faltan 3 semanas para el estreno',
        body: '<strong>{title}</strong> llega a la gran pantalla en tan solo 3 semanas. Recuerda que marcaste esta película como favorita — ¡no dejes pasar la oportunidad de verla en cines!',
        cta: 'Ver más detalles',
    },
    '2_weeks': {
        headline: '¡Solo 2 semanas para el estreno!',
        body: 'El estreno de <strong>{title}</strong> está a la vuelta de la esquina. Faltan apenas 2 semanas — es el momento perfecto para planear tu visita al cine.',
        cta: 'Ver horarios',
    },
    '1_week': {
        headline: '¡Una semana para el estreno!',
        body: '¡Ya falta muy poco! <strong>{title}</strong> se estrena en exactamente una semana. Asegura tu entrada ahora y vívela en la gran pantalla.',
        cta: 'Comprar entradas',
    },
    '2_days': {
        headline: '¡Faltan solo 2 días!',
        body: '¡El momento casi llega! <strong>{title}</strong> se estrena en 2 días. Si aún no has comprado tu entrada, ¡este es tu último aviso!',
        cta: '¡Comprar ahora!',
    },
};

export const MovieReminderEmailTemplate = (
    name: string,
    movieTitle: string,
    releaseDate: string,
    reminderType: MovieReminderType,
    posterUrl?: string,
): string => {
    const messages = reminderMessages[reminderType];
    const headline = messages.headline;
    const bodyText = messages.body.replace(/{title}/g, movieTitle);
    const cta = messages.cta;

    const formattedDate = new Date(releaseDate).toLocaleDateString('es-VE', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });

    const posterBlock = posterUrl
        ? `<tr>
            <td style="padding: 0 40px 20px 40px; text-align: center;">
                <img src="${posterUrl}" alt="${movieTitle}" style="max-width: 180px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);" />
            </td>
        </tr>`
        : '';

    return EmailLayout(
        `Recordatorio: ${movieTitle} - Cineflix`,
        `
    ${SectionTitle('🎬 Recordatorio de Estreno')}
    <tr>
        <td style="padding: 40px 40px 10px 40px;">
            <p style="margin: 0 0 20px 0; font-size: 18px; font-weight: bold; color: ${colors.textDark}; font-family: 'Arial', sans-serif; line-height: 1.4;">
                ¡Hola, ${name}!
            </p>
            <p style="margin: 0 0 10px 0; font-size: 22px; font-weight: bold; color: ${colors.primary}; font-family: 'Arial', sans-serif; line-height: 1.3;">
                ${headline}
            </p>
        </td>
    </tr>
    ${posterBlock}
    <tr>
        <td style="padding: 0 40px 30px 40px;">
            <p style="margin: 0 0 20px 0; font-size: 15px; color: ${colors.textMedium}; font-family: 'Arial', sans-serif; line-height: 1.8;">
                ${bodyText}
            </p>

            <div style="background-color: #f9f5ff; border-left: 4px solid ${colors.primary}; border-radius: 4px; padding: 16px 20px; margin: 0 0 30px 0;">
                <p style="margin: 0; font-size: 14px; color: ${colors.textMedium}; font-family: 'Arial', sans-serif;">
                    📅 <strong>Fecha de estreno:</strong> ${formattedDate}
                </p>
            </div>

            <div style="text-align: center; margin: 0 auto 35px auto;">
                <table align="center" border="0" cellpadding="0" cellspacing="0" style="margin: 0 auto;">
                    <tr>
                        <td align="center" bgcolor="${colors.accent}" style="background-color: ${colors.accent}; border-radius: 6px;">
                            <a href="https://frontend-web-teal-five.vercel.app/" target="_blank" style="padding: 14px 28px; text-transform: uppercase; font-size: 15px; font-family: 'Arial', sans-serif; font-weight: bold; color: ${colors.secondary}; text-decoration: none; display: inline-block;">
                                ${cta}
                            </a>
                        </td>
                    </tr>
                </table>
            </div>

            <div style="border-top: 1px solid ${colors.border}; padding-top: 20px; margin-top: 10px;">
                <p style="margin: 0; font-size: 13px; color: ${colors.textLight}; font-family: 'Arial', sans-serif; font-style: italic;">
                    Recibiste este correo porque marcaste esta película como favorita en Cineflix.
                    Si deseas dejar de recibir recordatorios, puedes administrar tus suscripciones desde tu perfil.
                </p>
            </div>
        </td>
    </tr>
    `,
    );
};
