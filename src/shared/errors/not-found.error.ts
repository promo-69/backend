import { AppError, type AppErrorOptions } from '@errors/app.error.js';

export class NotFoundError extends AppError {
	constructor(resource: string = 'Recurso', identifier?: any, options: Partial<AppErrorOptions> = {}) {
		const message = identifier ? `${resource} con el identificador '${identifier}' no encontrado` : resource;

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
