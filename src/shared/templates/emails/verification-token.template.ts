import { EmailLayout, SectionTitle, colors } from '../components/email.template.js';

export const VerificationTokenEmailTemplate = (code: string, name: string) => {
    return EmailLayout('Código de Verificación - Cineflix', `
    ${SectionTitle('Código de Verificación')}
    <tr>
        <td style="padding: 40px 40px 30px 40px;">

            <p style="margin: 0 0 20px 0; font-size: 16px; color: ${colors.textDark}; font-family: 'Arial', sans-serif; line-height: 1.6;">
                Hola <strong>${name}</strong>,
            </p>

            <p style="margin: 0 0 35px 0; font-size: 15px; color: ${colors.textMedium}; font-family: 'Arial', sans-serif; line-height: 1.8; text-align: center;">
                Gracias por unirte a Cineflix. Para confirmar tu identidad y completar tu registro, ingresa el siguiente código de 4 dígitos en la aplicación:
            </p>

            <div style="text-align: center; margin: 0 auto 35px auto;">
                <table align="center" border="0" cellpadding="0" cellspacing="0" style="margin: 0 auto;">
                    <tr>
                        <td align="center" style="background-color: ${colors.secondary}; border-radius: 8px; padding: 12px 24px 12px 36px; font-size: 36px; font-weight: bold; color: ${colors.accent}; font-family: 'Arial', sans-serif; letter-spacing: 12px; line-height: 1.2;">
                            ${code}
                        </td>
                    </tr>
                </table>
            </div>

            <p style="margin: 0 0 30px 0; font-size: 14px; color: ${colors.textLight}; font-family: 'Arial', sans-serif; text-align: center;">
                Tienes 10 minutos para verificar tu cuenta.
            </p>

            <div style="border-top: 1px solid ${colors.border}; padding-top: 25px; margin-top: 10px;">
                <p style="margin: 0; font-size: 13px; color: ${colors.textMedium}; font-family: 'Arial', sans-serif; line-height: 1.6;">
                    <strong>AVISO IMPORTANTE:</strong> Si no solicitaste este registro, por favor ignora este mensaje. No se realizará ninguna acción sin tu consentimiento.
                </p>
            </div>

        </td>
    </tr>
    `);
};
