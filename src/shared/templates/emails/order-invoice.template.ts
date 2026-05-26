export const OrderInvoiceEmailTemplate = (orderId: number, qrCode: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Factura de Compra - Cineflix</title>
  <style>
    body { font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px; }
    .container { background-color: #ffffff; padding: 20px; border-radius: 8px; max-width: 600px; margin: auto; }
    h1 { color: #333333; }
    .details { background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0; }
    .qr-box { text-align: center; margin-top: 20px; padding: 15px; border: 2px dashed #cccccc; border-radius: 8px; }
    .qr-text { font-size: 14px; color: #666; margin-top: 10px; }
  </style>
</head>
<body>
  <div class="container">
    <h1>¡Gracias por tu compra en Cineflix!</h1>
    <p>Tu orden ha sido procesada exitosamente.</p>
    
    <div class="details">
      <p><strong>Número de Orden:</strong> #${orderId}</p>
      <p><strong>Estado:</strong> PAGADO</p>
    </div>

    <div class="qr-box">
      <h3>Tu Código QR de Acceso</h3>
      <!-- En un entorno real generaríamos una imagen en base64 o URL al API de un generador de QR usando qrCode -->
      <p>Presenta este código alfanumérico o el QR generado en taquilla:</p>
      <h2>${qrCode}</h2>
      <p class="qr-text">Usa este código en nuestras instalaciones para validar tus entradas y combos.</p>
    </div>

    <p>Si tienes alguna pregunta, no dudes en contactarnos.</p>
    <p>¡Disfruta la película!</p>
  </div>
</body>
</html>
`;
