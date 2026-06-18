import { EmailLayout, SectionTitle, colors } from '../components/email.template.js';

export const WelcomeEmailTemplate = (name: string) => {
    return EmailLayout('¡Te damos la bienvenida a Cineflix!', `
    ${SectionTitle('¡Bienvenido a Cineflix!')}
    <tr>
        <td style="padding: 40px 40px 30px 40px;">

            <p style="margin: 0 0 20px 0; font-size: 18px; font-weight: bold; color: ${colors.textDark}; font-family: 'Arial', sans-serif; line-height: 1.4;">
                ¡Hola, ${name}!
            </p>

            <p style="margin: 0 0 20px 0; font-size: 15px; color: ${colors.textMedium}; font-family: 'Arial', sans-serif; line-height: 1.8;">
                Gracias por registrarte en Cineflix. Estamos muy emocionados de tenerte con nosotros y de que empieces a disfrutar de todo nuestro catálogo de entretenimiento.
            </p>

            <p style="margin: 0 0 35px 0; font-size: 15px; color: ${colors.textMedium}; font-family: 'Arial', sans-serif; line-height: 1.8;">
                Prepara las palomitas, relájate y prepárate para una experiencia cinematográfica única desde cualquier dispositivo.
            </p>

            <div style="text-align: center; margin: 0 auto 35px auto;">
                <table align="center" border="0" cellpadding="0" cellspacing="0" style="margin: 0 auto;">
                    <tr>
                        <td align="center" bgcolor="${colors.accent}" style="background-color: ${colors.accent}; border-radius: 6px;">
                            <a href="https://frontend-web-teal-five.vercel.app/" target="_blank" style="padding: 14px 28px; text-transform: uppercase; font-size: 15px; font-family: 'Arial', sans-serif; font-weight: bold; color: ${colors.secondary}; text-decoration: none; display: inline-block;">
                                Comenzar a Ver
                            </a>
                        </td>
                    </tr>
                </table>
            </div>

            <div style="border-top: 1px solid ${colors.border}; padding-top: 20px; margin-top: 10px;">
                <p style="margin: 0; font-size: 14px; color: ${colors.textLight}; font-family: 'Arial', sans-serif; font-style: italic;">
                    El equipo de Cineflix
                </p>
            </div>

        </td>
    </tr>
    `);
};
