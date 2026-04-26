import { AppConfig } from '@config/app.config.js';
import { Logger } from '@utils/logger.util.js';
import { nanoid } from 'nanoid';

export type AppErrorOptions = Partial<Error> & {
	statusCode?: number;
	data?: Record<string, unknown>;
	cause?: Error;
	code?: string;
	original?: Error;
	traceId?: string;
};

export class AppError extends Error {
	public readonly statusCode: number;
	public readonly data?: Record<string, unknown>;
	public readonly code: string;
	public readonly traceId: string;
	public readonly timestamp: Date;
	public readonly cause?: Error;

	constructor(options: AppErrorOptions = {}) {
		const message = options.message || 'An application error occurred with a non-specific message.';
		super(message);

		this.name = this.constructor.name;
		this.statusCode = options.statusCode || 500;
		this.code = options.code || 'SERVER_ERROR';
		this.data = options.data;
		this.traceId = options.traceId || nanoid(10);
		this.timestamp = new Date();
		this.cause =
			options?.cause != null
				? (options?.cause as any).original != null
					? (options?.cause as any).original
					: options?.cause
				: undefined;

		// Preservar stack trace
		if (Error.captureStackTrace) Error.captureStackTrace(this, this.constructor);

		Logger.error(null, this);
	}

	public getInheritanceInfo() {
		return {
			data: this.data,
			cause: this.cause,
		};
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
					cause: this.cause?.message,
				},
			}),
		};
	}
}
