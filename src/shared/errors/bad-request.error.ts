import { AppError } from '@errors/app.error.js';
import { type AppErrorOptions } from '@errors/app.error.js';

export class BadRequestError extends AppError {
	constructor(message: string = 'Bad Request', code?: string, options: Partial<AppErrorOptions> = {}) {
		super({
			statusCode: 400,
			message,
			code: code || 'BAD_REQUEST',
			...options,
		});
	}
}
