import { ValidationError } from '@errors';

export abstract class BaseService {
	protected serviceName: string;

	constructor() {
		this.serviceName = this.constructor.name;
	}

	protected validateRequired(data: Record<string, unknown>, requiredFields: string[]): void {
		if (typeof data !== 'object')
			throw new ValidationError('Los datos de la petición no son validos', requiredFields);

		const missingFields = requiredFields.filter(
			(field) => data[field] === undefined || data[field] === null || data[field] === '',
		);

		if (missingFields.length > 0)
			throw new ValidationError(
				`Faltan campos requeridos en la petición: ${missingFields.join(', ')}`,
				missingFields,
			);
	}

	protected sanitizeData<T>(data: Partial<T>, allowedFields: (keyof T)[]): Partial<T> {
		const sanitized: Partial<T> = {};

		allowedFields.forEach((field) => {
			if (data[field] !== undefined && data[field] !== null) sanitized[field] = data[field];
		});

		return sanitized;
	}

	protected validateRegexpFields(
		rules: { value: any; regex: RegExp; message: string }[],
		throwError = true,
	): void | string[] {
		const errors = rules.filter((rule) => !rule.regex.test(String(rule.value || ''))).map((rule) => rule.message);

		if (errors.length > 0 && throwError) throw new ValidationError('Los datos de petición no son validos', errors);

		return errors;
	}

	protected validatePattern(data: Record<string, unknown>, pattern: RegExp, throwError = true) {
		if (typeof data !== 'object') throw new ValidationError('Los datos de la petición no son validos', []);

		const errors = Object.entries(data)
			.filter(([, value]) => !pattern.test(String(value)))
			.map(([key]) => `${key} no cumple con los requisitos de formato`);

		if (errors.length > 0 && throwError)
			throw new ValidationError('Los datos de la petición no son validos', errors);

		return errors;
	}

	protected validateType(data: Record<string, unknown>, type: 'string' | 'number' | 'boolean', throwError = true) {
		if (typeof data !== 'object') throw new ValidationError('Los datos de la petición no son validos', []);

		const errors = Object.entries(data)
			.filter(([, value]) => typeof value !== type)
			.map(([key]) => `${key} debe ser de tipo ${type}`);

		if (errors.length > 0 && throwError)
			throw new ValidationError('Los datos de la petición no son validos', errors);

		return errors;
	}
}
