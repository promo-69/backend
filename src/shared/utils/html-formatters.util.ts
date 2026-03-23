/**
 * Formatea un título capitalizando palabras excepto conectores
 */
export const formatTitle = (str: string): string => {
    if (!str) return '';

    const connectors = [
        'a',
        'ante',
        'bajo',
        'cabe',
        'con',
        'contra',
        'de',
        'desde',
        'durante',
        'en',
        'entre',
        'hacia',
        'hasta',
        'mediante',
        'para',
        'por',
        'según',
        'sin',
        'so',
        'sobre',
        'tras',
        'versus',
        'vía',
        'la',
        'el',
        'los',
        'las',
        'un',
        'una',
        'unos',
        'unas',
        'y',
        'o',
        'u',
        'e',
        'ni',
        'que',
    ];

    return str
        .split(' ')
        .map((word, index) => {
            const lowerWord = word.toLowerCase();

            if (index > 0 && connectors.includes(lowerWord)) return word.toLowerCase();

            return word.charAt(0).toUpperCase() + word.slice(1);
        })
        .join(' ');
};

/**
 * Convierte un array de objetos a una tabla HTML
 */
export const createHTMLTable = (rows: Array<Record<string, any>>): string => {
    if (!rows || !Array.isArray(rows) || rows.length === 0) return '';

    const headers = Array.from(new Set(rows.flatMap((row) => Object.keys(row))));

    const parsedHeaders = headers.map((head) => formatTitle(head.replace(/_/g, ' ')));

    return `
    <table style="width: 100%; border-collapse: collapse; background-color: #ffffff;">
      <thead>
        <tr style="background-color: #f8f9fa; border-bottom: 2px solid #e9ecef;">
          ${parsedHeaders
              .map(
                  (header) =>
                      `<th style="padding: 12px; text-align: left; font-weight: 600; border-bottom: 2px solid #dee2e6;">
              ${header}
            </th>`,
              )
              .join('')}
        </tr>
      </thead>
      <tbody>
        ${rows
            .map(
                (row) => `
          <tr style="border-bottom: 1px solid #e9ecef;">
            ${headers
                .map(
                    (header) => `
              <td style="padding: 12px; color: #212529;">
                ${row.hasOwnProperty(header) ? String(row[header] || '') : ''}
              </td>
            `,
                )
                .join('')}
          </tr>
        `,
            )
            .join('')}
      </tbody>
    </table>
  `;
};

/**
 * Aplica un tema HTML al contenido
 */
export const applyEmailTheme = (content: string, primaryColor: string = '#00233b'): string => {
    return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
          line-height: 1.6;
          color: #333;
          margin: 0;
          padding: 20px;
          background-color: #f5f5f5;
        }
        .email-container {
          max-width: 600px;
          margin: 0 auto;
          background-color: white;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .email-header {
          background-color: ${primaryColor};
          color: white;
          padding: 20px;
          text-align: center;
        }
        .email-content {
          padding: 30px;
        }
        .email-footer {
          background-color: #f8f9fa;
          padding: 20px;
          text-align: center;
          border-top: 1px solid #e9ecef;
          font-size: 14px;
          color: #6c757d;
        }
        a {
          color: ${primaryColor} !important;
          text-decoration: none;
        }
        a:hover {
          text-decoration: underline;
        }
        p {
          margin-bottom: 16px;
        }
        ul, ol {
          margin-bottom: 16px;
          padding-left: 24px;
        }
        li {
          margin-bottom: 8px;
        }
        .button {
          display: inline-block;
          padding: 12px 24px;
          background-color: ${primaryColor};
          color: white !important;
          text-decoration: none;
          border-radius: 4px;
          font-weight: 600;
        }
        .button:hover {
          opacity: 0.9;
          text-decoration: none !important;
        }
        .highlight {
          background-color: #fff3cd;
          border-left: 4px solid #ffc107;
          padding: 12px;
          margin: 16px 0;
        }
        .info-box {
          background-color: #e7f3ff;
          border-left: 4px solid #0d6efd;
          padding: 16px;
          margin: 16px 0;
          border-radius: 0 4px 4px 0;
        }
      </style>
    </head>
    <body>
      <div class="email-container">
        <div class="email-header">
          <h1 style="margin: 0; font-size: 24px;">UCLA</h1>
          <p style="margin: 5px 0 0; opacity: 0.9;">Universidad Centroccidental Lisandro Alvarado</p>
        </div>
        <div class="email-content">
          ${content}
        </div>
        <div class="email-footer">
          <p style="margin: 0;">
            © ${new Date().getFullYear()} Universidad Centroccidental Lisandro Alvarado.<br>
            Este es un correo automático, por favor no responda a esta dirección.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
};

/**
 * Formatea una lista de requerimientos
 */
export const formatRequirementsList = (requirements: Array<{ quantity: number; description: string }>): string => {
    if (!requirements || !Array.isArray(requirements)) return '';

    return `
    <ul>
      ${requirements.map((req) => `<li><strong>(${req.quantity})</strong> ${req.description}</li>`).join('')}
    </ul>
  `;
};
