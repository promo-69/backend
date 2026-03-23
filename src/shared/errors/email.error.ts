import { AppError, type AppErrorOptions } from './app.error.js';

export class EmailError extends AppError {
    constructor(message: string, code?: string, options: Partial<AppErrorOptions> = {}) {
        super({
            statusCode: 500,
            message,
            code: code || 'EMAIL_ERROR',
            ...options,
        });
    }
}

export class EmailConfigurationError extends EmailError {
    constructor(message: string) {
        super(message, 'EMAIL_CONFIGURATION_ERROR');
    }
}

export class EmailTemplateError extends EmailError {
    constructor(message: string) {
        super(message, 'EMAIL_TEMPLATE_ERROR');
    }
}

export class EmailValidationError extends EmailError {
    constructor(message: string) {
        super(message, 'EMAIL_VALIDATION_ERROR');
    }
}

export class EmailSendError extends EmailError {
    constructor(message: string) {
        super(message, 'EMAIL_SEND_ERROR');
    }
}
