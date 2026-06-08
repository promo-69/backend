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
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #4CAF50; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
        .content { background-color: #f9f9f9; padding: 20px; border-radius: 0 0 5px 5px; }
        .details { background-color: white; padding: 15px; margin: 15px 0; border-radius: 5px; border: 1px solid #ddd; }
        .button { background-color: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 15px 0; }
        .footer { font-size: 12px; color: #777; text-align: center; margin-top: 20px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>¡Solicitud Aprobada!</h1>
        </div>
        <div class="content">
            <p>¡Hola!</p>
            <p>Tu solicitud de alquiler de sala ha sido <strong>aprobada</strong>. A continuación los detalles:</p>

            <div class="details">
                <p><strong>Evento:</strong> ${eventName}</p>
                <p><strong>Sala:</strong> ${roomName}</p>
                <p><strong>Cine:</strong> ${cinemaName}</p>
                <p><strong>Precio total:</strong> ${price} USD</p>
                <p><strong>Referencia:</strong> #${requestId}</p>
            </div>

            <p>Para confirmar la reserva y activar la sala, debes completar el pago dentro de las próximas <strong>48 horas</strong>.</p>

            <div style="text-align: center;">
                <a href="${frontendUrl}/rentals/payment/${requestId}" class="button">Pagar ahora</a>
            </div>

            <p>Si no realizas el pago en el plazo indicado, la reserva será cancelada automáticamente.</p>

            <p>¿Tienes preguntas? Contáctanos respondiendo a este correo.</p>

            <div class="footer">
                <p>Cineflix - Tu mejor experiencia de cine</p>
            </div>
        </div>
    </div>
</body>
</html>
    `;
};
