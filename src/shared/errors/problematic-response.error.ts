import { AppError, type AppErrorOptions } from '@errors/app.error.js';

export class ProblematicResponseError extends AppError {
	constructor(message: string = 'Error interno del servidor', options: Partial<AppErrorOptions> = {}) {
		super({
			statusCode: 500,
			message,
			code: 'RESPONSE_PROBLEM',
			...options,
		});
	}
}
