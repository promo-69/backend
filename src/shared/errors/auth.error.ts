import { AppError, type AppErrorOptions } from '@errors/app.error.js';

export class AuthError extends AppError {
	constructor(message: string = 'Authentication failed', options: Partial<AppErrorOptions> = {}) {
		super({
			statusCode: 401,
			message,
			code: 'AUTH_ERROR',
			...options,
		});
	}
}

export class ForbiddenError extends AppError {
	constructor(message: string = 'Access forbidden', options: Partial<AppErrorOptions> = {}) {
		super({
			statusCode: 403,
			message,
			code: 'FORBIDDEN',
			...options,
		});
	}
}

export class SessionNotFoundError extends AppError {
	constructor(message: string = 'Sesión no encontrada', options: Partial<AppErrorOptions> = {}) {
		super({
			statusCode: 401,
			message,
			code: 'SESSION_NOT_FOUND',
			...options,
		});
	}
}
