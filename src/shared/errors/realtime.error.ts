import { AppError, type AppErrorOptions } from '@errors/app.error.js';

export class RealtimeError extends AppError {
	constructor(
		message: string = 'Ocurrió algo inesperado al manejar las interacciónes en tiempo real',
		options: Partial<AppErrorOptions> = {},
	) {
		super({
			statusCode: 500,
			message,
			code: 'REALTIME_PROBLEM',
			...options,
		});
	}
}
