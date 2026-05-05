import nodemailer from 'nodemailer';
import { AppConfig } from '@config/app.config.js';
import { Logger } from '@utils/logger.util.js';
import { ANSI } from '@utils/ansi.util.js';
import { nanoid } from 'nanoid';

const EMAIL_PROVIDER_SYMBOL = Symbol.for('global.email.provider');

export class EmailProvider {
	private static _instance: EmailProvider;
	private transporter: nodemailer.Transporter;
	private fromAddress: string;

	private constructor() {
		const config = AppConfig.load();

		this.fromAddress = config.emailProvider.from;

		console.log('SOY MAILERRRRR', config.emailProvider, ' | ', {
			host: config.emailProvider.host,
			port: config.emailProvider.port,
			secure: config.emailProvider.port === 465, // true for 465, false for other ports
			auth: {
				user: config.emailProvider.user,
				pass: config.emailProvider.pass,
			},
			debug: true,
		});

		this.transporter = nodemailer.createTransport({
			host: config.emailProvider.host,
			port: config.emailProvider.port,
			secure: config.emailProvider.port === 465, // true for 465, false for other ports
			auth: {
				user: config.emailProvider.user,
				pass: config.emailProvider.pass,
			},
			debug: true,
		});

		try {
			// Verify connection configuration if user and pass are provided
			if (config.emailProvider.user && config.emailProvider.pass) {
				console.log('\nantes de probar el transportador');
				this.transporter
					.verify()
					.then(() => {
						Logger.natural(
							ANSI.success(`[+] Connected to Email Provider (SMTP: ${config.emailProvider.host})`),
						);

						// Iniciar envío de prueba
						this.sendMail(
							'pastoralirio6589@gmail.com',
							'Prueba de conexión',
							`<h1>Prueba exitosa en entorno ${AppConfig.isProduction() ? 'produccion' : 'desarrollo'}</h1>`,
						);
					})
					.catch((err) => {
						console.log('\nerror caputrado al intentar verificar el transportador');
						Logger.error('Email Provider Connection Error:', err);
					});
				console.log('\ndespues de intentar probar el transportador');
			} else {
				console.log('\nSOY MAILERRRRR SIN CREDENCIALES');
				Logger.warn('Email Provider initialized without credentials. Emails may not send.');
			}
		} catch (error) {
			console.log('\nerror caputrado al inicializar el transportador');
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

			if (!globalWithEmail[EMAIL_PROVIDER_SYMBOL]) globalWithEmail[EMAIL_PROVIDER_SYMBOL] = new EmailProvider();

			return globalWithEmail[EMAIL_PROVIDER_SYMBOL];
		}
	}

	async sendMail(to: string, subject: string, html: string): Promise<boolean> {
		const emailId = nanoid(5);

		try {
			Logger.natural(ANSI.success(`[+] Sending email ${emailId}`));
			const response = await this.transporter.sendMail({
				from: `"Cineflix" <${this.fromAddress}>`,
				to,
				subject,
				html,
			});
			Logger.natural(ANSI.success(`[+] Email ${emailId} sent to ${to}`));
			return true;
		} catch (error) {
			Logger.error(`Failed to send email ${emailId} to ${to}:`, error as Error);
			return false;
		}
	}
}

export const emailProvider = EmailProvider.getInstance();
