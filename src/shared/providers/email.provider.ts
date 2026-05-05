import nodemailer from 'nodemailer';
import dns from 'dns';
import { AppConfig } from '@config/app.config.js';
import { Logger } from '@utils/logger.util.js';
import { ANSI } from '@utils/ansi.util.js';
import { nanoid } from 'nanoid';

dns.setDefaultResultOrder('ipv4first');

const EMAIL_PROVIDER_SYMBOL = Symbol.for('global.email.provider');

export class EmailProvider {
	private static _instance: EmailProvider;
	private transporter: nodemailer.Transporter;
	private fromAddress: string;

	private constructor() {
		const config = AppConfig.load();

		this.fromAddress = config.emailProvider.from;

		this.transporter = nodemailer.createTransport({
			host: config.emailProvider.host,
			port: config.emailProvider.port,
			secure: config.emailProvider.port === 465,
			auth: {
				user: config.emailProvider.user,
				pass: config.emailProvider.pass,
			},
			connectionTimeout: 10000,
			greetingTimeout: 10000,
			socketTimeout: 10000,
			logger: true,
			debug: true,
		});

		try {
			if (config.emailProvider.user && config.emailProvider.pass) {
				console.log('\nIniciando verificacion del transportador...');

				this.transporter
					.verify()
					.then(() => {
						Logger.natural(
							ANSI.success(`[+] Connected to Email Provider (SMTP: ${config.emailProvider.host})`),
						);

						this.sendMail('pastoralirio6589@gmail.com', 'Prueba de conexión', '<h1>Prueba exitosa</h1>');
					})
					.catch((err) => {
						Logger.error('Email Provider Connection Error:', err);
					});
			} else {
				Logger.warn('Email Provider initialized without credentials.');
			}
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
