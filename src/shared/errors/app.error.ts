import { AppConfig } from '@config/app.config.js';
import { Logger } from '@utils/logger.util.js';
import { nanoid } from 'nanoid';

export interface AppErrorOptions {
    statusCode?: number;
    message?: string;
    data?: Record<string, unknown>;
    cause?: Error;
    code?: string;
    traceId?: string;
}

export class AppError extends Error {
    public readonly statusCode: number;
    public readonly data?: Record<string, unknown>;
    public readonly code: string;
    public readonly traceId: string;
    public readonly timestamp: Date;
    public readonly originalError?: Error;

    constructor(options: AppErrorOptions = {}) {
        const message = options.message || 'An application error occurred with a non-specific message.';
        super(message);

        this.name = this.constructor.name;
        this.statusCode = options.statusCode || 500;
        this.code = options.code || 'SERVER_ERROR';
        this.data = options.data;
        this.traceId = options.traceId || nanoid(10);
        this.timestamp = new Date();
        this.originalError = options.cause;

        // Preservar stack trace
        if (Error.captureStackTrace) Error.captureStackTrace(this, this.constructor);

        // Si hay error original, combinar stacks
        if (options.cause) this.stack = `${this.stack}\nCaused by: ${options.cause.stack}`;

        Logger.error(null, this);
    }

    public toJSON() {
        const isDev = AppConfig.isDevelopment();

        return {
            name: this.name,
            message: this.message,
            code: this.code,
            statusCode: this.statusCode,
            timestamp: this.timestamp.toISOString(),
            traceId: this.traceId,
            ...(isDev && {
                debug: {
                    stack: this.stack,
                    data: this.data,
                    originalError: this.originalError?.message,
                },
            }),
        };
    }
}
