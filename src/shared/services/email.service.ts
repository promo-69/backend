import { EmailProvider } from '@providers/email.provider.js';
import { PasswordResetEmailTemplate } from '@templates/emails/password-reset.template.js';
import { VerificationTokenEmailTemplate } from '@templates/emails/verification-token.template.js';
import { WelcomeEmailTemplate } from '@templates/emails/welcome.template.js';
import { OrderInvoiceEmailTemplate } from '../templates/emails/order-invoice.template.js';

class EmailService {
	private get provider() {
		return EmailProvider.getInstance();
	}

	/**
	 * Envía un correo genérico
	 */
	async sendEmail(to: string, subject: string, html: string): Promise<boolean> {
		return this.provider.sendMail(to, subject, html);
	}

	/**
	 * Envía un correo de bienvenida al usuario
	 */
	async sendWelcomeEmail(to: string, name: string): Promise<boolean> {
		const subject = `¡Bienvenido a Cineflix!`;
		const html = WelcomeEmailTemplate(name);
		return this.provider.sendMail(to, subject, html);
	}

	/**
	 * Envía un código de verificación para el registro (signup_code)
	 */
	async sendVerificationCode(to: string, token: string, name: string): Promise<boolean> {
		const subject = `Código de Verificación`;
		const html = VerificationTokenEmailTemplate(token, name);
		return this.provider.sendMail(to, subject, html);
	}

	/**
	 * Envía un enlace o token para restablecer la contraseña
	 */
	async sendPasswordResetEmail(to: string, resetToken: string): Promise<boolean> {
		const subject = `Restablecimiento de Contraseña`;
		const html = PasswordResetEmailTemplate(resetToken);
		return this.provider.sendMail(to, subject, html);
	}

	/**
	 * Envía la factura de compra y el código QR
	 */
	async sendOrderInvoiceEmail(to: string, orderId: number, qrCode: string): Promise<boolean> {
		const subject = `Factura de Compra #${orderId} - Cineflix`;
		const html = OrderInvoiceEmailTemplate(orderId, qrCode);
		return this.provider.sendMail(to, subject, html);
	}

	// =========================================================================
	//  NUEVOS MÉTODOS PARA ALQUILERES (RENTALS)
	// =========================================================================

	/**
	 * Envía notificación de aprobación de solicitud de alquiler
	 */
	async sendRentalApproval(
		to: string,
		eventName: string,
		roomName: string,
		cinemaName: string,
		price: number,
		requestId: number,
	): Promise<boolean> {
		const frontendUrl = process.env.FRONTEND_URL || 'https://cineflix.com';
		const subject = `✅ Solicitud de alquiler aprobada: ${eventName}`;
		const html = `
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
						<h1>¡Solicitud Aprobada! 🎉</h1>
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
		return this.provider.sendMail(to, subject, html);
	}

	/**
	 * Envía notificación de rechazo de solicitud de alquiler
	 */
	async sendRentalRejection(to: string, eventName: string, requestId: number): Promise<boolean> {
		const subject = `❌ Solicitud de alquiler rechazada: ${eventName}`;
		const html = `
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
		return this.provider.sendMail(to, subject, html);
	}
}

export const emailService = new EmailService();
