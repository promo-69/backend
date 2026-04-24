export const VerificationTokenEmailTemplate = (token: string) => `
	<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
		<h1 style="color: #E50914;">Verificación de Cuenta</h1>
		<p>Te encuentras finalizando el proceso de registro en Cineflix. Para confirmar tu dirección de correo electrónico y activar tu cuenta, por favor ingresa al siguiente enlace:</p>
		<div style="background-color: #f4f4f4; padding: 15px; text-align: center; border-radius: 5px; margin: 20px 0;">
			<h2 style="letter-spacing: 5px; margin: 0; color: #333;">https://127.0.0.1/activate?token=${token}</h2>
		</div>
		<p>Si no fuiste tú quien solicitó este código, puedes ignorar este mensaje con seguridad.</p>
		<hr style="border: 1px solid #eee; margin: 20px 0;" />
		<p style="font-size: 12px; color: #777;">El equipo de Cineflix</p>
	</div>
`;
