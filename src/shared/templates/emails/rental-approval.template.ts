export const RentalApprovalEmailTemplate = (
    eventName: string,
    roomName: string,
    cinemaName: string,
    price: number,
    requestId: number,
): string => {
    const frontendUrl = process.env.FRONTEND_URL || 'https://cineflix.com';

    return `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Solicitud de Alquiler Aprobada - Cineflix</title>
    <style type="text/css">
        body {
            margin: 0;
            padding: 0;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', 'Montserrat', 'Arial', sans-serif;
            background-color: #f5f5f5;
        }
        table {
            border-collapse: collapse;
            border-spacing: 0;
        }
        img {
            border: 0;
            display: block;
            outline: none;
            text-decoration: none;
        }
    </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f5f5f5;">

    <table width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5;">
        <tr>
            <td align="center" style="padding: 20px;">

                <table width="100%" max-width="600" border="0" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #ffffff; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">

                    <tr>
                        <td align="center" style="padding: 40px 20px; background-color: #3d2456; background: linear-gradient(135deg, #3d2456 0%, #4a2f68 100%);">
                            <table width="100%" border="0" cellpadding="0" cellspacing="0" style="max-width: 500px;">
                                <tr>
                                    <td align="center" style="padding: 0;">
                                        <img src="https://ik.imagekit.io/cineflix/cineflix/resources/logo-cineflix.png" alt="Cineflix Logo" width="300" style="width: 100%; max-width: 350px; height: auto; margin: 20px 0;">
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <tr>
                        <td align="center" style="padding: 20px; background-color: #1a1a2e;">
                            <h2 style="margin: 0; font-size: 24px; font-weight: bold; color: #ffffff; font-family: 'Arial', sans-serif; letter-spacing: 2px;">SOLICITUD APROBADA</h2>
                        </td>
                    </tr>

                    <tr>
                        <td style="padding: 40px 30px;">

                            <p style="margin: 0 0 25px 0; font-size: 16px; color: #333333; font-family: 'Arial', sans-serif; line-height: 1.6;">
                                ¡Hola!
                            </p>

                            <p style="margin: 0 0 30px 0; font-size: 15px; color: #555555; font-family: 'Arial', sans-serif; line-height: 1.8;">
                                Tu solicitud de alquiler de sala ha sido <strong>aprobada</strong>. A continuación los detalles:
                            </p>

                            <table align="center" border="0" cellpadding="0" cellspacing="0" style="margin: 30px auto; width: 100%; background-color: #f9f9f9; border: 1px solid #e0e0e0; border-radius: 8px;">
                                <tr>
                                    <td style="padding: 20px;">
                                        <p style="margin: 0 0 10px 0;"><strong>🎬 Evento:</strong> ${eventName}</p>
                                        <p style="margin: 0 0 10px 0;"><strong>🏛️ Sala:</strong> ${roomName}</p>
                                        <p style="margin: 0 0 10px 0;"><strong>🎦 Cine:</strong> ${cinemaName}</p>
                                        <p style="margin: 0 0 10px 0;"><strong>💰 Precio total:</strong> ${price} USD</p>
                                        <p style="margin: 0 0 0 0;"><strong>🔖 Referencia:</strong> #${requestId}</p>
                                    </td>
                                </tr>
                            </table>

                            <p style="margin: 20px 0 10px 0; font-size: 15px; color: #555555; text-align: center;">
                                Para confirmar la reserva y activar la sala, debes completar el pago dentro de las próximas <strong>48 horas</strong>.
                            </p>

                            <table align="center" border="0" cellpadding="0" cellspacing="0" style="margin: 30px auto;">
                                <tr>
                                    <td align="center" style="background-color: #d4a444; border-radius: 30px;">
                                        <a href="${frontendUrl}/rentals/payment/${requestId}" style="display: inline-block; padding: 12px 30px; font-size: 16px; font-weight: bold; color: #1a1a2e; text-decoration: none; font-family: 'Arial', sans-serif;">Pagar ahora</a>
                                    </td>
                                </tr>
                            </table>

                            <p style="margin: 30px 0 0 0; font-size: 13px; color: #333333; font-family: 'Arial', sans-serif; line-height: 1.7; border-top: 1px solid #e0e0e0; padding-top: 20px;">
                                Si no realizas el pago en el plazo indicado, la reserva será cancelada automáticamente. ¿Preguntas? Contáctanos respondiendo a este correo.
                            </p>

                        </td>
                    </tr>

                    <tr>
                        <td align="center" style="padding: 20px; background-color: #1a1a2e; border-top: 3px solid #3d2456;">
                            <p style="margin: 0; font-size: 12px; color: #999999; font-family: 'Arial', sans-serif; line-height: 1.6;">
                                © Cineflix | Todos los derechos reservados | <a href="#" style="color: #d4a444; text-decoration: none;">Términos y Condiciones</a>
                            </p>
                        </td>
                    </tr>

                </table>
                </td>
        </tr>
    </table>
</body>
</html>
    `;
};
