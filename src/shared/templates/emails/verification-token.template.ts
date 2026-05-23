export const VerificationTokenEmailTemplate = (email: string, token: string) => `
	<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Verificación de Correo - Cineflix</title>
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

    <!-- Wrapper table -->
    <table width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5;">
        <tr>
            <td align="center" style="padding: 20px;">

                <!-- Main container -->
                <table width="100%" max-width="600" border="0" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #ffffff; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">

                    <!-- Header with dark purple background for logo area -->
                    <tr>
                        <td align="center" style="padding: 40px 20px; background-color: #3d2456; background: linear-gradient(135deg, #3d2456 0%, #4a2f68 100%);">

                            <!-- Logo and branding table -->
                            <table width="100%" border="0" cellpadding="0" cellspacing="0" style="max-width: 500px;">
                                <tr>
                                    <td align="center" style="padding: 0;">
                                        <!-- Logo image with pizza icon -->
                                        <img src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Gemini_Generated_Image_1vet1z1vet1z1vet-pthwJrNvJvf85h8UTGBCWD7Z1UxCeZ.png" alt="Cineflix Logo" width="300" style="width: 100%; max-width: 350px; height: auto; margin: 20px 0;">
                                    </td>
                                </tr>
                            </table>

                        </td>
                    </tr>

                    <!-- Title section -->
                    <tr>
                        <td align="center" style="padding: 20px; background-color: #1a1a2e;">
                            <h2 style="margin: 0; font-size: 28px; font-weight: bold; color: #ffffff; font-family: 'Arial', sans-serif; letter-spacing: 2px;">VERIFICACIÓN DE CORREO</h2>
                        </td>
                    </tr>

                    <!-- Content section -->
                    <tr>
                        <td style="padding: 40px 30px;">

                            <!-- Greeting -->
                            <p style="margin: 0 0 25px 0; font-size: 16px; color: #333333; font-family: 'Arial', sans-serif; line-height: 1.6;">
                                Hola <strong>[User Name]</strong>,
                            </p>

                            <!-- Body text -->
                            <p style="margin: 0 0 30px 0; font-size: 15px; color: #555555; font-family: 'Arial', sans-serif; line-height: 1.8;">
                                Gracias por unirte a Cineflix. Para confirmar tu registro y comenzar a ver, por favor verifica tu correo electrónico haciendo clic en el botón de abajo:
                            </p>

                            <!-- CTA Button -->
                            <table width="100%" border="0" cellpadding="0" cellspacing="0" style="margin: 35px 0;">
                                <tr>
                                    <td align="center">
                                        <table border="0" cellpadding="0" cellspacing="0">
                                            <tr>
                                                <td align="center" style="background-color: #d4a444; border-radius: 8px; padding: 0;">
                                                    <a href="https://frontend-web-teal-five.vercel.app/verify-account?email=${email}&token=${token}" style="display: inline-block; padding: 16px 40px; font-size: 16px; font-weight: bold; color: #1a1a2e; text-decoration: none; font-family: 'Arial', sans-serif; border-radius: 8px; letter-spacing: 1px;">
                                                        VERIFICAR MI CORREO
                                                    </a>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>

                            <!-- Important notice -->
                            <p style="margin: 35px 0 0 0; font-size: 13px; color: #333333; font-family: 'Arial', sans-serif; line-height: 1.7; border-top: 1px solid #e0e0e0; padding-top: 20px;">
                                <strong>**AVISO IMPORTANTE:**</strong> Si tú no solicitaste este registro, por favor ignora este mensaje. No se realizará ninguna acción sin tu consentimiento.
                            </p>

                        </td>
                    </tr>

                    <!-- Footer section -->
                    <tr>
                        <td align="center" style="padding: 20px; background-color: #1a1a2e; border-top: 3px solid #3d2456;">
                            <p style="margin: 0; font-size: 12px; color: #999999; font-family: 'Arial', sans-serif; line-height: 1.6;">
                                © Cineflix | Todos los derechos reservados | <a href="#" style="color: #d4a444; text-decoration: none;">Términos y Condiciones</a>
                            </p>
                        </td>
                    </tr>

                </table>
                <!-- End main container -->

            </td>
        </tr>
    </table>
    <!-- End wrapper table -->

</body>
</html>
`;
