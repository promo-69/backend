import { AppError } from '@errors';
import { type AppErrorOptions } from '@errors/app.error.js';

export class ConflictError extends AppError {
    constructor(message: string = 'Conflict on request', code?: string, options: Partial<AppErrorOptions> = {}) {
        super({
            statusCode: 409,
            message,
            code: code || 'CONFLICT_ERROR',
            ...options,
        });
    }
}

// Si quieres errores más específicos de conflicto:
export class ResourceConflictError extends ConflictError {
    constructor(resource: string, field: string, value: any) {
        super(`El recurso '${resource}' ya existe con ${field}: ${value}`, 'RESOURCE_CONFLICT');
    }
}

export class DuplicateEntryError extends ConflictError {
    constructor(field: string, value: any) {
        super(`Ya existe un registro con ${field}: ${value}`, 'DUPLICATE_ENTRY');
    }
}

export class ActiveSessionError extends ConflictError {
    constructor(message: string = 'Ya tienes una sesión activa') {
        super(message, 'ACTIVE_SESSION_EXISTS');
    }
}
