import { EmailProvider } from '@providers/email.provider.js';
import { PasswordResetEmailTemplate } from '@templates/emails/password-reset.template.js';
import { VerificationTokenEmailTemplate } from '@templates/emails/verification-token.template.js';
import { WelcomeEmailTemplate } from '@templates/emails/welcome.template.js';

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
		const subject = '¡Bienvenido a Cineflix!';
		const html = WelcomeEmailTemplate(name);
		return this.provider.sendMail(to, subject, html);
	}

	/**
	 * Envía un código de verificación para el registro (signup_code)
	 */
	async sendVerificationCode(to: string, token: string): Promise<boolean> {
		const subject = 'Código de Verificación - Cineflix';
		const html = VerificationTokenEmailTemplate(token);
		return this.provider.sendMail(to, subject, html);
	}

	/**
	 * Envía un enlace o token para restablecer la contraseña
	 */
	async sendPasswordResetEmail(to: string, resetToken: string): Promise<boolean> {
		const subject = 'Restablecimiento de Contraseña - Cineflix';
		const html = PasswordResetEmailTemplate(resetToken);
		return this.provider.sendMail(to, subject, html);
	}
}

export const emailService = new EmailService();
