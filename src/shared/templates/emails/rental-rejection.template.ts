export const RentalRejectionEmailTemplate = (eventName: string, requestId: number): string => {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #f44336; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
        .content { background-color: #f9f9f9; padding: 20px; border-radius: 0 0 5px 5px; }
        .details { background-color: white; padding: 15px; margin: 15px 0; border-radius: 5px; border: 1px solid #ddd; }
        .footer { font-size: 12px; color: #777; text-align: center; margin-top: 20px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Solicitud Rechazada</h1>
        </div>
        <div class="content">
            <p>¡Hola!</p>
            <p>Lamentamos informarte que tu solicitud de alquiler de sala ha sido <strong>rechazada</strong>.</p>

            <div class="details">
                <p><strong>Evento:</strong> ${eventName}</p>
                <p><strong>Referencia:</strong> #${requestId}</p>
            </div>

            <p>Si deseas más información sobre esta decisión, por favor contáctanos directamente respondiendo a este correo.</p>

            <p>También puedes realizar una nueva solicitud con diferentes fechas o salas.</p>

            <div class="footer">
                <p>Cineflix - Tu mejor experiencia de cine</p>
            </div>
        </div>
    </div>
</body>
</html>
    `;
};
