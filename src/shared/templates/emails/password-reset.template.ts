export const PasswordResetEmailTemplate = (resetToken: string) => `
	<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
		<h1 style="color: #E50914;">Restablecer Contraseña</h1>
		<p>Hemos recibido una solicitud para restablecer la contraseña de tu cuenta en Cineflix.</p>
		<p>Utiliza el siguiente token de seguridad para crear una nueva contraseña:</p>
		<div style="background-color: #f4f4f4; padding: 15px; text-align: center; border-radius: 5px; margin: 20px 0;">
			<p style="margin: 0; font-family: monospace; word-break: break-all; color: #333;">${resetToken}</p>
		</div>
		<p>Este token expirará pronto. Si no solicitaste un restablecimiento de contraseña, por favor ignora este correo y asegúrate de que tu cuenta esté segura.</p>
		<hr style="border: 1px solid #eee; margin: 20px 0;" />
		<p style="font-size: 12px; color: #777;">El equipo de Cineflix</p>
	</div>
`;
