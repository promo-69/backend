import { AppConfig } from '@config/app.config.js';
import { AppError } from '@errors/app.error.js';

export class UnknownError extends AppError {
	constructor(originalError: Error, additionalInfo?: Record<string, unknown>) {
		// Extraer información útil del error original
		const errorName = originalError.name || 'UnknownError';
		const errorMessage = originalError.message || 'An unexpected error occurred';

		// Capturar stack trace más detallado
		const stackLines = originalError.stack?.split('\n') || [];
		const relevantStack = stackLines.slice(0, 12).join('\n');

		// Información adicional para debugging
		const debugInfo: Record<string, unknown> = {
			originalErrorName: errorName,
			originalErrorMessage: errorMessage,
			stackTrace: relevantStack,
			...additionalInfo,
		};

		const isDev = AppConfig.isDevelopment();

		super({
			statusCode: 500,
			message: isDev ? `Unexpected error: ${errorName}: ${errorMessage}` : `Unexpected error: ${errorMessage}`,
			code: 'UNKNOWN_ERROR',
			cause: originalError,
			data: {
				timestamp: new Date().toISOString(),
				environment: isDev ? 'development' : 'production',
				...debugInfo,
			},
		});
	}
}
