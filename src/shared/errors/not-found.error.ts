import { AppError, type AppErrorOptions } from '@errors/app.error.js';

export class NotFoundError extends AppError {
    constructor(resource: string = 'Resource', identifier?: any, options: Partial<AppErrorOptions> = {}) {
        const message = identifier ? `${resource} with identifier '${identifier}' not found` : `${resource} not found`;

        super({
            statusCode: 404,
            message,
            code: 'NOT_FOUND',
            data: {
                resource,
                identifier,
                ...options.data,
            },
            ...options,
        });
    }
}
