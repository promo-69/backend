import { ControllerBase } from '@bases/controller.base.js';
import { emailService } from '@services/email.service.js';

class EmailController extends ControllerBase {
	constructor() {
		super();
	}

	async sendTestEmail() {
		const { email } = this.getParams();

		const html = `
			<div style="font-family: Arial, sans-serif; padding: 20px;">
				<h1 style="color: #333;">Prueba de Envío de Correo - Cineflix</h1>
				<p style="font-size: 16px; color: #555;">
					Hola,
				</p>
				<p style="font-size: 16px; color: #555;">
					Si estás recibiendo este mensaje, significa que el servicio de correos de la API está funcionando correctamente.
				</p>
				<br/>
				<p style="font-size: 14px; color: #888;">
					Este es un mensaje generado automáticamente.
				</p>
			</div>
		`;

		const success = await emailService.sendEmail(email, 'Prueba Nominal de Correo - Cineflix', html);

		if (success) {
			return this.success(null, `Correo de prueba enviado a ${email} exitosamente.`);
		} else {
			throw new Error(`Hubo un problema intentando enviar el correo de prueba a ${email}`);
		}
	}
}

export default new EmailController();
