import { AppError, type AppErrorOptions } from '@errors/app.error.js';

export class ValidationError extends AppError {
    constructor(
        message: string = 'Validation failed',
        validationErrors?: Record<string, unknown> | string[],
        options?: Partial<AppErrorOptions>,
    ) {
        const data = {
            validationErrors: Array.isArray(validationErrors) ? { general: validationErrors } : validationErrors,
            ...options?.data,
        };

        super({
            statusCode: 400,
            message,
            code: 'VALIDATION_ERROR',
            data,
            ...(options ?? {}),
        });
    }
}
