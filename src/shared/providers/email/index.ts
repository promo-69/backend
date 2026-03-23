import { type EmailTemplateData } from '@rules/email.type.js';
import {
    EmailTemplateError,
    EmailValidationError,
    EmailConfigurationError,
    EmailSendError,
} from '@errors/email.error.js';
import { EmailProvider } from './email.provider.js';
import { TemplateManager } from './template.manager.js';

export class EmailService {
    private emailProvider: EmailProvider;
    private templateManager: TemplateManager;

    constructor() {
        this.emailProvider = new EmailProvider();
        this.templateManager = new TemplateManager();
        this.initializeTemplates();
    }

    /**
     * Inicializa todas las plantillas
     */
    private initializeTemplates(): void {
        /*const templatesArray = Object.values(documentTemplates);

        this.templateManager.registerMany(templatesArray);

        if (process.env.NODE_ENV === 'development')
            console.log(`[+] Sistema de email inicializado con ${templatesArray.length} plantillas`);*/
    }

    /**
     * Añade una cuenta de correo
     */
    async addAccount(accountId: string, config: any): Promise<any> {
        try {
            return await this.emailProvider.addAccount(accountId, config);
        } catch (error) {
            if (error instanceof EmailConfigurationError) throw error;

            throw new EmailConfigurationError(
                `Error al configurar cuenta "${accountId}": ${
                    error instanceof Error ? error.message : 'Error desconocido'
                }`,
            );
        }
    }

    /**
     * Envía un correo usando una plantilla
     */
    async sendTemplate(
        accountId: string,
        templateName: string,
        data: EmailTemplateData & { to?: string | string[] },
    ): Promise<any> {
        try {
            // Validar que exista la plantilla
            if (!this.templateManager.has(templateName))
                throw new EmailTemplateError(`La plantilla "${templateName}" no está disponible`);

            // Validar que haya destinatario
            const to = data.to;
            if (!to) throw new EmailValidationError('No se especificó destinatario. El campo "to" es requerido');

            // Compilar plantilla
            const { subject, html, text } = this.templateManager.compile(templateName, data);

            // Enviar correo
            return await this.emailProvider.send(accountId, {
                to,
                subject,
                html,
                text,
            });
        } catch (error) {
            // Si ya es un error de email, re-lanzarlo
            if (
                error instanceof EmailTemplateError ||
                error instanceof EmailValidationError ||
                error instanceof EmailConfigurationError ||
                error instanceof EmailSendError
            ) {
                throw error;
            }

            // Convertir errores genéricos a errores específicos
            throw new EmailSendError(
                `Error al enviar correo con plantilla "${templateName}": ${
                    error instanceof Error ? error.message : 'Error desconocido'
                }`,
            );
        }
    }

    async send(accountId: string, options: any): Promise<any> {
        try {
            return await this.emailProvider.send(accountId, options);
        } catch (error) {
            if (error instanceof EmailSendError || error instanceof EmailValidationError) throw error;

            throw new EmailSendError(
                `Error al enviar correo: ${error instanceof Error ? error.message : 'Error desconocido'}`,
            );
        }
    }

    hasAccount(accountId: string): boolean {
        return this.emailProvider.hasAccount(accountId);
    }

    getAccount(accountId: string): any {
        return this.emailProvider.getAccount(accountId);
    }

    removeAccount(accountId: string): boolean {
        return this.emailProvider.removeAccount(accountId);
    }

    listAccounts(): any[] {
        return this.emailProvider.listAccounts();
    }

    /**
     * Métodos del template manager
     */
    registerTemplate(template: any): void {
        this.templateManager.register(template);
    }

    getTemplate(templateName: string): any {
        return this.templateManager.get(templateName);
    }

    listTemplates(): any[] {
        return this.templateManager.list();
    }

    hasTemplate(templateName: string): boolean {
        return this.templateManager.has(templateName);
    }

    /**
     * Limpia recursos
     */
    async close(): Promise<void> {
        try {
            await this.emailProvider.closeAll();
            this.templateManager.clear();

            if (process.env.NODE_ENV === 'development') console.log('[+] Servicio de email cerrado exitosamente');
        } catch (error) {
            if (process.env.NODE_ENV === 'development') console.error('[X] Error al cerrar servicio de email:', error);
        }
    }
}

export default new EmailService();
