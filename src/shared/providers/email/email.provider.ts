import nodemailer, { type Transporter, type SendMailOptions as NodemailerSendMailOptions } from 'nodemailer';
import { EmailConfigurationError, EmailValidationError, EmailSendError } from '@errors';
import { type EmailAccountConfig, type SendMailOptions } from '@rules/email.type.js';

export class EmailProvider {
    private transporters: Map<string, Transporter> = new Map();
    private accounts: Map<string, EmailAccountConfig> = new Map();

    /**
     * Añade o actualiza una cuenta de correo
     */
    async addAccount(accountId: string, config: EmailAccountConfig): Promise<Transporter> {
        if (!accountId || !config.email || !config.password)
            throw new EmailConfigurationError(
                `No se pudo añadir el mailer para la cuenta (${accountId}), faltan datos o los proporcionados son inválidos.`,
            );

        if (this.transporters.has(accountId)) return this.transporters.get(accountId)!;

        const transporterConfig: any = {
            auth: {
                user: config.email,
                pass: config.password,
            },
            connectionTimeout: 5000,
            greetingTimeout: 5000,
            socketTimeout: 5000,
            logger: process.env.NODE_ENV === 'development',
        };

        if (config.service && config.service !== 'smtp') {
            transporterConfig.service = config.service;
        } else {
            transporterConfig.host = config.host || 'smtp.gmail.com';
            transporterConfig.port = config.port || (config.secure ? 465 : 587);
            transporterConfig.secure = config.secure ?? true;
        }

        try {
            const transporter = nodemailer.createTransport(transporterConfig);

            await transporter.verify();

            this.transporters.set(accountId, transporter);
            this.accounts.set(accountId, config);

            console.log(`[+] Cuenta de correo "${accountId}" configurada exitosamente`);
            return transporter;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Error desconocido al configurar cuenta';

            if (process.env.NODE_ENV === 'development')
                console.error(`[X] Error configurando cuenta "${accountId}":`, error);

            throw new EmailConfigurationError(`Error configurando cuenta de correo "${accountId}": ${errorMessage}`);
        }
    }

    /**
     * Verifica si existe una cuenta
     */
    hasAccount(accountId: string): boolean {
        return this.transporters.has(accountId);
    }

    /**
     * Obtiene el transportador de una cuenta
     */
    getAccount(accountId: string): Transporter | undefined {
        return this.transporters.get(accountId);
    }

    /**
     * Elimina una cuenta
     */
    removeAccount(accountId: string): boolean {
        const removed = this.transporters.delete(accountId);
        this.accounts.delete(accountId);
        return removed;
    }

    /**
     * Lista todas las cuentas registradas
     */
    listAccounts(): Array<{ id: string; email: string; name?: string }> {
        return Array.from(this.accounts.entries()).map(([id, config]) => ({
            id,
            email: config.email,
            name: config.name,
        }));
    }

    /**
     * Envía un correo electrónico
     */
    async send(accountId: string, options: SendMailOptions): Promise<any> {
        if (!this.hasAccount(accountId))
            throw new EmailConfigurationError(`No existe transportador configurado para la cuenta "${accountId}"`);

        // Validar parámetros requeridos
        if (!options.to) throw new EmailValidationError('El destinatario (to) es requerido');

        if (!options.subject) throw new EmailValidationError('El asunto (subject) es requerido');

        if (!options.html) throw new EmailValidationError('El contenido HTML (html) es requerido');

        const transporter = this.getAccount(accountId)!;
        const accountConfig = this.accounts.get(accountId)!;

        const mailOptions: NodemailerSendMailOptions = {
            from: accountConfig.name ? `"${accountConfig.name}" <${accountConfig.email}>` : accountConfig.email,
            to: options.to,
            subject: options.subject,
            html: options.html,
            text: options.text,
            cc: options.cc,
            bcc: options.bcc,
            attachments: options.attachments,
        };

        try {
            const info = await transporter.sendMail(mailOptions);

            if (process.env.NODE_ENV === 'development')
                console.log(`[+] Correo enviado desde "${accountId}": ${info.messageId}`);

            return info;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Error desconocido al enviar correo';

            if (process.env.NODE_ENV === 'development')
                console.error(`[X] Error enviando correo desde "${accountId}":`, error);

            throw new EmailSendError(`Error enviando correo desde "${accountId}": ${errorMessage}`);
        }
    }

    /**
     * Verifica la conexión de una cuenta
     */
    async verifyConnection(accountId: string): Promise<boolean> {
        try {
            const transporter = this.getAccount(accountId);
            if (!transporter) return false;

            await transporter.verify();
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Cierra todas las conexiones
     */
    async closeAll(): Promise<void> {
        for (const [accountId, transporter] of this.transporters.entries()) {
            try {
                transporter.close();

                if (process.env.NODE_ENV === 'development')
                    console.log(`[+] Conexión cerrada para cuenta "${accountId}"`);
            } catch (error) {
                if (process.env.NODE_ENV === 'development')
                    console.error(`[X] Error cerrando conexión para cuenta "${accountId}":`, error);
            }
        }

        this.transporters.clear();
        this.accounts.clear();
    }
}

// Instancia singleton
export const emailProvider = new EmailProvider();
export default emailProvider;
