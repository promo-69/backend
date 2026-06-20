export const OrderInvoiceEmailTemplate = (order: any, qrCode: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Factura de Compra - Cineflix</title>
  <style>
    body { font-family: 'Helvetica Neue', Arial, sans-serif; background-color: #f4f7f6; margin: 0; padding: 40px 20px; color: #333; }
    .container { background-color: #ffffff; padding: 40px; border-radius: 12px; max-width: 700px; margin: auto; box-shadow: 0 4px 15px rgba(0,0,0,0.05); }
    .header { text-align: center; border-bottom: 2px solid #eee; padding-bottom: 20px; margin-bottom: 30px; }
    h1 { color: #e50914; margin: 0; font-size: 28px; }
    .order-info { text-align: center; margin-bottom: 30px; color: #666; font-size: 16px; }
    .details-container { display: flex; flex-wrap: wrap; gap: 20px; }
    .section { flex: 1; min-width: 280px; background: #f9fafb; padding: 20px; border-radius: 8px; border: 1px solid #eaeaea; }
    .section-title { font-size: 18px; color: #333; border-bottom: 2px solid #e50914; padding-bottom: 10px; margin-top: 0; margin-bottom: 15px; }
    .item-row { display: flex; justify-content: space-between; margin-bottom: 10px; font-size: 14px; }
    .item-name { font-weight: bold; }
    .total-row { display: flex; justify-content: space-between; margin-top: 20px; font-size: 18px; font-weight: bold; padding-top: 15px; border-top: 2px dashed #ccc; }
    .qr-box { text-align: center; margin-top: 30px; padding: 20px; background: #fff; border: 2px dashed #e50914; border-radius: 8px; }
    .qr-code { font-size: 32px; letter-spacing: 5px; color: #e50914; margin: 15px 0; font-weight: bold; }
    .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #999; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Cineflix</h1>
    </div>
    
    <div class="order-info">
      <strong>¡Gracias por tu compra!</strong><br>
      Tu orden <strong>#${order.id}</strong> en <strong>${order.cinemaName}</strong> ha sido procesada.
    </div>

    <div class="details-container">
      ${order.movieData ? `
      <div class="section">
        <h3 class="section-title">🎬 Tu Película</h3>
        <div class="item-row"><span>Película:</span> <span class="item-name">${order.movieData.title}</span></div>
        <div class="item-row"><span>Fecha/Hora:</span> <span>${new Date(order.movieData.date).toLocaleString()}</span></div>
        <div class="item-row"><span>Sala:</span> <span>${order.movieData.roomName}</span></div>
        <div class="item-row"><span>Entradas:</span> <span>${order.movieData.ticketsCount}</span></div>
      </div>
      ` : ''}

      ${order.confectioneryItems && order.confectioneryItems.length > 0 ? `
      <div class="section">
        <h3 class="section-title">🍿 Confitería</h3>
        ${order.confectioneryItems.map((item: any) => `
          <div class="item-row">
            <span class="item-name">${item.quantity}x ${item.name}</span>
            <span>$${item.price}</span>
          </div>
        `).join('')}
      </div>
      ` : ''}
    </div>

    <div class="total-row">
      <span>Total Pagado:</span>
      <span>$${order.total}</span>
    </div>

    <div class="qr-box">
      <h3>Tu Código de Acceso</h3>
      <p style="color: #666; font-size: 14px;">Presenta este código en taquilla y dulcería</p>
      <div class="qr-code">${qrCode}</div>
    </div>

    <div class="footer">
      <p>Este es un comprobante de tu compra. Por favor guárdalo para tu visita.</p>
      <p>&copy; ${new Date().getFullYear()} Cineflix. Todos los derechos reservados.</p>
    </div>
  </div>
</body>
</html>
`;
