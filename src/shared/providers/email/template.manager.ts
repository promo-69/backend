import { EmailTemplateError, EmailValidationError } from '@errors/email.error.js';
import { type EmailTemplate, type EmailTemplateData, type EmailResult } from '@rules/email.type.js';

export class TemplateManager {
    private templates: Map<string, EmailTemplate> = new Map();

    /**
     * Registra una plantilla
     */
    register(template: EmailTemplate): void {
        this.templates.set(template.name, template);

        if (process.env.NODE_ENV === 'development') console.log(`[+] Plantilla registrada: "${template.name}"`);
    }

    /**
     * Registra múltiples plantillas
     */
    registerMany(templates: EmailTemplate[]): void {
        templates.forEach((template) => this.register(template));
    }

    /**
     * Compila una plantilla con datos
     */
    compile(templateName: string, data: EmailTemplateData): EmailResult {
        const template = this.templates.get(templateName);

        if (!template) throw new EmailTemplateError(`La plantilla "${templateName}" no fue encontrada`);

        // Validar variables requeridas
        const missingVariables = template.variables
            .filter((v) => v.required && data[v.name] === undefined)
            .map((v) => v.name);

        if (missingVariables.length > 0)
            throw new EmailValidationError(
                `Faltan variables requeridas para la plantilla "${templateName}": ${missingVariables.join(', ')}`,
            );

        try {
            return template.template(data);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Error desconocido al compilar plantilla';
            throw new EmailTemplateError(`Error compilando la plantilla "${templateName}": ${errorMessage}`);
        }
    }

    /**
     * Obtiene información de una plantilla
     */
    get(templateName: string): EmailTemplate | undefined {
        return this.templates.get(templateName);
    }

    /**
     * Lista todas las plantillas
     */
    list(): EmailTemplate[] {
        return Array.from(this.templates.values());
    }

    /**
     * Verifica si existe una plantilla
     */
    has(templateName: string): boolean {
        return this.templates.has(templateName);
    }

    /**
     * Elimina una plantilla
     */
    remove(templateName: string): boolean {
        const removed = this.templates.delete(templateName);

        if (removed && process.env.NODE_ENV === 'development')
            console.log(`[+] Plantilla eliminada: "${templateName}"`);

        return removed;
    }

    /**
     * Limpia todas las plantillas
     */
    clear(): void {
        this.templates.clear();
    }
}
