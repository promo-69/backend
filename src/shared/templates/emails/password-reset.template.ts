import { EmailLayout, SectionTitle, colors } from '../components/email.template.js';

export const PasswordResetEmailTemplate = (resetToken: string) => {
    return EmailLayout('Restablecer Contraseña - Cineflix', `
    ${SectionTitle('Restablecer Contraseña')}
    <tr>
        <td style="padding: 40px 40px 30px 40px;">

            <p style="margin: 0 0 20px 0; font-size: 15px; color: ${colors.textMedium}; font-family: 'Arial', sans-serif; line-height: 1.8;">
                Hemos recibido una solicitud para restablecer la contraseña de tu cuenta en Cineflix.
            </p>

            <p style="margin: 0 0 35px 0; font-size: 15px; color: ${colors.textMedium}; font-family: 'Arial', sans-serif; line-height: 1.8;">
                Utiliza el siguiente código de seguridad para crear una nueva contraseña:
            </p>

            <div style="text-align: center; margin: 0 auto 35px auto;">
                <table align="center" border="0" cellpadding="0" cellspacing="0" style="margin: 0 auto; width: 100%; max-width: 450px;">
                    <tr>
                        <td align="center" style="background-color: ${colors.secondary}; border-radius: 8px; padding: 12px 24px 12px 36px; font-size: 36px; font-weight: bold; color: ${colors.accent}; font-family: 'Arial', sans-serif; letter-spacing: 12px; line-height: 1.2;">
                            ${resetToken}
                        </td>
                    </tr>
                </table>
            </div>

            <p style="margin: 0 0 30px 0; font-size: 14px; color: ${colors.textLight}; font-family: 'Arial', sans-serif; text-align: center;">
                Este código expirará pronto.
            </p>

            <div style="border-top: 1px solid ${colors.border}; padding-top: 25px; margin-top: 10px;">
                <p style="margin: 0 0 20px 0; font-size: 13px; color: ${colors.textMedium}; font-family: 'Arial', sans-serif; line-height: 1.6;">
                    <strong>AVISO IMPORTANTE:</strong> Si no solicitaste un restablecimiento de contraseña, por favor ignora este correo y asegúrate de que tu cuenta esté segura.
                </p>

                <p style="margin: 0; font-size: 14px; color: ${colors.textLight}; font-family: 'Arial', sans-serif; font-style: italic;">
                    El equipo de Cineflix
                </p>
            </div>

        </td>
    </tr>
    `);
};
