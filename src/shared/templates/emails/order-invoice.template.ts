import { EmailLayout, SectionTitle, colors } from '../components/email.template.js';

export const OrderInvoiceEmailTemplate = (order: any, qrCodeBase64: string) => {
    const symbol = order.currencySymbol || 'Bs.';

    const content = `
    ${SectionTitle('Factura de Compra')}
    <tr>
        <td style="padding: 30px 40px; font-family: 'Arial', sans-serif;">
            
            <p style="margin: 0 0 25px 0; font-size: 15px; color: ${colors.textMedium}; line-height: 1.6; text-align: center;">
                ¡Hola! Gracias por tu compra.<br><br>
                Tu orden <strong style="color: ${colors.secondary};">#${order.id}</strong> en <strong style="color: ${colors.secondary};">${order.cinemaName}</strong> ha sido procesada exitosamente.
            </p>

            ${order.movieData ? `
            <div style="margin-bottom: 25px;">
                <h3 style="margin: 0 0 10px 0; font-size: 18px; color: ${colors.secondary}; border-bottom: 2px solid ${colors.primary}; padding-bottom: 5px;">🎬 Detalles de la Película</h3>
                <p style="margin: 0 0 15px 0; font-size: 16px; font-weight: bold; color: ${colors.accent};">${order.movieData.title}</p>
                
                <p style="margin: 0 0 15px 0; font-size: 14px; color: ${colors.textMedium};">
                    <strong>Horario:</strong> ${new Date(order.movieData.date).toLocaleString('es-VE')}<br>
                    <strong>Sala:</strong> ${order.movieData.roomName}
                </p>

                <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse; margin-bottom: 10px;">
                    <tr>
                        <th align="left" style="padding: 10px; background-color: ${colors.background}; font-size: 13px; color: ${colors.textMedium}; border-bottom: 1px solid ${colors.border};">Cant.</th>
                        <th align="left" style="padding: 10px; background-color: ${colors.background}; font-size: 13px; color: ${colors.textMedium}; border-bottom: 1px solid ${colors.border};">Boletos</th>
                        <th align="right" style="padding: 10px; background-color: ${colors.background}; font-size: 13px; color: ${colors.textMedium}; border-bottom: 1px solid ${colors.border};">P. Unit</th>
                        <th align="right" style="padding: 10px; background-color: ${colors.background}; font-size: 13px; color: ${colors.textMedium}; border-bottom: 1px solid ${colors.border};">Total</th>
                    </tr>
                    ${order.movieData.ticketsList.map((t: any) => `
                    <tr>
                        <td align="center" style="padding: 12px 10px; border-bottom: 1px solid ${colors.border}; font-size: 14px; color: ${colors.textDark}; width: 10%;">${t.count}x</td>
                        <td align="left" style="padding: 12px 10px; border-bottom: 1px solid ${colors.border}; font-size: 14px; color: ${colors.textDark};">Entrada ${t.name}</td>
                        <td align="right" style="padding: 12px 10px; border-bottom: 1px solid ${colors.border}; font-size: 14px; color: ${colors.textMedium};">${symbol}${t.unitPrice}</td>
                        <td align="right" style="padding: 12px 10px; border-bottom: 1px solid ${colors.border}; font-size: 14px; color: ${colors.textDark}; font-weight: bold;">${symbol}${t.total}</td>
                    </tr>
                    `).join('')}
                </table>
            </div>
            ` : ''}

            ${order.confectioneryItems && order.confectioneryItems.length > 0 ? `
            <div style="margin-bottom: 25px;">
                <h3 style="margin: 0 0 10px 0; font-size: 18px; color: ${colors.secondary}; border-bottom: 2px solid ${colors.primary}; padding-bottom: 5px;">🍿 Confitería</h3>
                
                <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse; margin-bottom: 10px;">
                    <tr>
                        <th align="left" style="padding: 10px; background-color: ${colors.background}; font-size: 13px; color: ${colors.textMedium}; border-bottom: 1px solid ${colors.border};">Cant.</th>
                        <th align="left" style="padding: 10px; background-color: ${colors.background}; font-size: 13px; color: ${colors.textMedium}; border-bottom: 1px solid ${colors.border};">Producto / Combo</th>
                        <th align="right" style="padding: 10px; background-color: ${colors.background}; font-size: 13px; color: ${colors.textMedium}; border-bottom: 1px solid ${colors.border};">P. Unit</th>
                        <th align="right" style="padding: 10px; background-color: ${colors.background}; font-size: 13px; color: ${colors.textMedium}; border-bottom: 1px solid ${colors.border};">Total</th>
                    </tr>
                    ${order.confectioneryItems.map((item: any) => `
                    <tr>
                        <td align="center" style="padding: 12px 10px; border-bottom: 1px solid ${colors.border}; font-size: 14px; color: ${colors.textDark}; width: 10%;">${item.quantity}x</td>
                        <td align="left" style="padding: 12px 10px; border-bottom: 1px solid ${colors.border}; font-size: 14px; color: ${colors.textDark};">${item.name}</td>
                        <td align="right" style="padding: 12px 10px; border-bottom: 1px solid ${colors.border}; font-size: 14px; color: ${colors.textMedium};">${symbol}${item.unitPrice}</td>
                        <td align="right" style="padding: 12px 10px; border-bottom: 1px solid ${colors.border}; font-size: 14px; color: ${colors.textDark}; font-weight: bold;">${symbol}${item.totalPrice}</td>
                    </tr>
                    `).join('')}
                </table>
            </div>
            ` : ''}

            ${order.payments && order.payments.length > 0 ? `
            <div style="margin-bottom: 25px;">
                <h3 style="margin: 0 0 10px 0; font-size: 18px; color: ${colors.secondary}; border-bottom: 2px solid ${colors.primary}; padding-bottom: 5px;">💳 Pagos Realizados</h3>
                
                <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse; margin-bottom: 10px;">
                    <tr>
                        <th align="left" style="padding: 10px; background-color: ${colors.background}; font-size: 13px; color: ${colors.textMedium}; border-bottom: 1px solid ${colors.border};">Método de Pago</th>
                        <th align="left" style="padding: 10px; background-color: ${colors.background}; font-size: 13px; color: ${colors.textMedium}; border-bottom: 1px solid ${colors.border};">Referencia</th>
                        <th align="right" style="padding: 10px; background-color: ${colors.background}; font-size: 13px; color: ${colors.textMedium}; border-bottom: 1px solid ${colors.border};">Monto</th>
                    </tr>
                    ${order.payments.map((p: any) => `
                    <tr>
                        <td align="left" style="padding: 12px 10px; border-bottom: 1px solid ${colors.border}; font-size: 14px; color: ${colors.textDark};">${p.method}</td>
                        <td align="left" style="padding: 12px 10px; border-bottom: 1px solid ${colors.border}; font-size: 14px; color: ${colors.textMedium};">${p.reference === 'N/A' ? '-' : p.reference}</td>
                        <td align="right" style="padding: 12px 10px; border-bottom: 1px solid ${colors.border}; font-size: 14px; color: ${colors.textDark}; font-weight: bold;">${symbol}${p.amount}</td>
                    </tr>
                    `).join('')}
                </table>
            </div>
            ` : ''}

            <div style="text-align: right; padding: 20px 10px; border-top: 2px solid ${colors.secondary}; margin-top: 15px;">
                <span style="font-size: 18px; color: ${colors.textMedium}; font-weight: bold;">Total Pagado:</span>
                <span style="font-size: 22px; color: ${colors.accent}; margin-left: 15px; font-weight: bold;">${symbol}${order.total}</span>
            </div>

            <div style="background-color: ${colors.background}; border: 2px dashed ${colors.border}; border-radius: 8px; text-align: center; padding: 30px 20px; margin-top: 40px;">
                <h3 style="margin: 0 0 10px 0; color: ${colors.secondary};">Tu Código de Acceso</h3>
                <p style="margin: 0 0 20px 0; color: ${colors.textMedium}; font-size: 14px; line-height: 1.5;">
                    Presenta este código en la taquilla y/o área de dulcería para validar tu compra. Puedes mostrarlo desde tu celular.
                </p>
                ${qrCodeBase64 ? `<img src="${qrCodeBase64}" alt="Código QR" style="max-width: 200px; height: auto; display: block; margin: 0 auto;" />` : '<p style="font-style: italic; color: #999;">Código QR no disponible en este momento</p>'}
            </div>

            <div style="text-align: center; margin-top: 30px;">
                <p style="margin: 0; font-size: 13px; color: ${colors.textLight}; line-height: 1.6;">
                    Este es un comprobante automático de tu compra.<br>Por favor guárdalo para tu visita.
                </p>
            </div>
        </td>
    </tr>
    `;

    return EmailLayout(`Factura de Compra #${order.id} - Cineflix`, content);
};

