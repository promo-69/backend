import { google } from 'googleapis';
import { AppConfig } from '@config/app.config.js';
import { Logger } from '@utils/logger.util.js';
import { ANSI } from '@utils/ansi.util.js';
import { nanoid } from 'nanoid';

const EMAIL_PROVIDER_SYMBOL = Symbol.for('global.email.provider');

export class EmailProvider {
	private static _instance: EmailProvider;
	private oauth2Client;
	private gmail;
	private fromAddress: string;

	private constructor() {
		const config = AppConfig.load();

		this.fromAddress = config.emailProvider.from;

		// Configuramos el cliente OAuth2 con las nuevas credenciales
		const OAuth2 = google.auth.OAuth2;
		this.oauth2Client = new OAuth2(
			config.emailProvider.clientId,
			config.emailProvider.clientSecret,
			'https://developers.google.com/oauthplayground',
		);

		// Le entregamos el token de refresco para que Google no nos pida iniciar sesion de nuevo
		this.oauth2Client.setCredentials({
			refresh_token: config.emailProvider.refreshToken,
		});

		// Inicializamos el cliente de la API de Gmail
		this.gmail = google.gmail({ version: 'v1', auth: this.oauth2Client });

		try {
			Logger.natural(ANSI.success(`[+] Email Provider initialized via Google API for ${this.fromAddress}`));
		} catch (error) {
			Logger.error('Email Provider Initialization Error:', error as Error);
		}
	}

	static getInstance(): EmailProvider {
		if (AppConfig.isProduction()) {
			if (!this._instance) this._instance = new EmailProvider();
			return this._instance;
		} else {
			const globalWithEmail = globalThis as typeof globalThis & {
				[EMAIL_PROVIDER_SYMBOL]: EmailProvider;
			};

			if (!globalWithEmail[EMAIL_PROVIDER_SYMBOL]) {
				globalWithEmail[EMAIL_PROVIDER_SYMBOL] = new EmailProvider();
			}

			return globalWithEmail[EMAIL_PROVIDER_SYMBOL];
		}
	}

	async sendMail(to: string, subject: string, html: string): Promise<boolean> {
		const emailId = nanoid(5);

		try {
			Logger.natural(ANSI.success(`[+] Sending email ${emailId} via HTTP Gmail API`));

			// Codificamos el asunto en UTF-8 Base64 para evitar errores con tildes o caracteres especiales
			const utf8Subject = `=?utf-8?B?${Buffer.from(subject).toString('base64')}?=`;

			// Construimos el cuerpo del correo respetando el estandar MIME
			const messageParts = [
				`From: "Cineflix" <${this.fromAddress}>`,
				`To: ${to}`,
				'Content-Type: text/html; charset=utf-8',
				'MIME-Version: 1.0',
				`Subject: ${utf8Subject}`,
				'',
				html,
			];

			const message = messageParts.join('\n');

			// Google exige que el mensaje este codificado en formato Base64 URL-safe
			const encodedMessage = Buffer.from(message)
				.toString('base64')
				.replace(/\+/g, '-')
				.replace(/\//g, '_')
				.replace(/=+$/, '');

			// Ejecutamos la peticion HTTP a la API de Gmail
			await this.gmail.users.messages.send({
				userId: 'me',
				requestBody: {
					raw: encodedMessage,
				},
			});

			Logger.natural(ANSI.success(`[+] Email ${emailId} sent successfully to ${to}`));
			return true;
		} catch (error) {
			Logger.error(`Failed to send email ${emailId} to ${to}:`, error as Error);
			return false;
		}
	}
}

export const emailProvider = EmailProvider.getInstance();
