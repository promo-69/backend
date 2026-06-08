export const RentalRejectionEmailTemplate = (eventName: string, requestId: number): string => {
    return `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Solicitud de Alquiler Rechazada - Cineflix</title>
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
                            <h2 style="margin: 0; font-size: 24px; font-weight: bold; color: #ffffff; font-family: 'Arial', sans-serif; letter-spacing: 2px;">SOLICITUD RECHAZADA</h2>
                        </td>
                    </tr>

                    <tr>
                        <td style="padding: 40px 30px;">

                            <p style="margin: 0 0 25px 0; font-size: 16px; color: #333333; font-family: 'Arial', sans-serif; line-height: 1.6;">
                                ¡Hola!
                            </p>

                            <p style="margin: 0 0 30px 0; font-size: 15px; color: #555555; font-family: 'Arial', sans-serif; line-height: 1.8;">
                                Lamentamos informarte que tu solicitud de alquiler de sala ha sido <strong>rechazada</strong>.
                            </p>

                            <table align="center" border="0" cellpadding="0" cellspacing="0" style="margin: 30px auto; width: 100%; background-color: #f9f9f9; border: 1px solid #e0e0e0; border-radius: 8px;">
                                <tr>
                                    <td style="padding: 20px;">
                                        <p style="margin: 0 0 10px 0;"><strong>🎬 Evento:</strong> ${eventName}</p>
                                        <p style="margin: 0 0 0 0;"><strong>🔖 Referencia:</strong> #${requestId}</p>
                                    </td>
                                </tr>
                            </table>

                            <p style="margin: 20px 0 10px 0; font-size: 15px; color: #555555;">
                                Si deseas más información sobre esta decisión, por favor contáctanos directamente respondiendo a este correo.
                            </p>

                            <p style="margin: 10px 0 0 0; font-size: 15px; color: #555555;">
                                También puedes realizar una nueva solicitud con diferentes fechas o salas.
                            </p>

                            <p style="margin: 30px 0 0 0; font-size: 13px; color: #333333; font-family: 'Arial', sans-serif; line-height: 1.7; border-top: 1px solid #e0e0e0; padding-top: 20px;">
                                Gracias por confiar en Cineflix. Quedamos a tu disposición para cualquier consulta.
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
