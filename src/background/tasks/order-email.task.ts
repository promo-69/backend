import { emailService } from '@services/email.service.js';

/**
 * Tarea encargada de enviar el correo de confirmación (factura y QR) de una orden.
 */
export async function orderEmailTask(email: string, orderId: number, qrCode: string): Promise<void> {
	await emailService.sendOrderInvoiceEmail(email, orderId, qrCode);
}
