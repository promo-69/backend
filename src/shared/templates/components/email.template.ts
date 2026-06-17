// Estilos base compartidos
export const colors = {
    background: '#f5f5f5',
    surface: '#ffffff',
    primary: '#3d2456',
    primaryGradient: 'linear-gradient(135deg, #3d2456 0%, #4a2f68 100%)',
    secondary: '#1a1a2e',
    accent: '#d4a444',
    textDark: '#333333',
    textMedium: '#555555',
    textLight: '#777777',
    textMuted: '#999999',
    border: '#eeeeee'
};

const fontFamily = "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', 'Montserrat', 'Arial', sans-serif";

// Componente Envoltura Principal (Layout)
export const EmailLayout = (title: string, content: string) => `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style type="text/css">
        body { margin: 0; padding: 0; font-family: ${fontFamily}; background-color: ${colors.background}; }
        table { border-collapse: collapse; border-spacing: 0; }
        img { border: 0; display: block; outline: none; text-decoration: none; }
    </style>
</head>
<body style="margin: 0; padding: 0; background-color: ${colors.background}; -webkit-font-smoothing: antialiased;">
    <table width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color: ${colors.background}; width: 100%;">
        <tr>
            <td align="center" style="padding: 30px 15px;">
                <table border="0" cellpadding="0" cellspacing="0" style="width: 100%; max-width: 600px; background-color: ${colors.surface}; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.05);">
                    ${EmailHeader()}
                    ${content}
                    ${EmailFooter()}
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
`;

// Componente Cabecera (Header)
const EmailHeader = () => `
<tr>
    <td align="center" style="padding: 40px 20px; background-color: ${colors.primary}; background: ${colors.primaryGradient};">
        <img src="https://ik.imagekit.io/cineflix/cineflix/resources/logo-cineflix.png" alt="Cineflix Logo" style="width: 100%; max-width: 250px; height: auto; display: block;">
    </td>
</tr>
`;

// Componente Pie de Pagina (Footer)
const EmailFooter = () => `
<tr>
    <td align="center" style="padding: 25px 20px; background-color: ${colors.secondary}; border-top: 4px solid ${colors.primary};">
        <p style="margin: 0 0 10px 0; font-size: 12px; color: ${colors.textMuted}; font-family: 'Arial', sans-serif; line-height: 1.5;">
            © ${new Date().getFullYear()} Cineflix. Todos los derechos reservados.
        </p>
        <p style="margin: 0; font-size: 12px; font-family: 'Arial', sans-serif;">
            <a href="#" style="color: ${colors.accent}; text-decoration: none;">Términos y Condiciones</a>
            &nbsp;|&nbsp;
            <a href="#" style="color: ${colors.accent}; text-decoration: none;">Política de Privacidad</a>
        </p>
    </td>
</tr>
`;

// Componente Titulo de Seccion
export const SectionTitle = (text: string) => `
<tr>
    <td align="center" style="padding: 20px; background-color: ${colors.secondary};">
        <h2 style="margin: 0; font-size: 22px; font-weight: bold; color: ${colors.surface}; font-family: 'Arial', sans-serif; letter-spacing: 3px; text-transform: uppercase;">
            ${text}
        </h2>
    </td>
</tr>
`;
