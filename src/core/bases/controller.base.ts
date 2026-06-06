import { type CookieOptions, type Request, type Response, type NextFunction } from 'express';
import { QueryBuilder } from '@utils/query-builder.util.js';
import { type ApiResponse } from '@rules/api-response.type.js';
import { type PaginationMetadata, type ProcessedQueryFilters } from '@rules/api-query.type.js';
import { AppError, UnknownError, ProblematicResponseError } from '@errors';
import { Validator } from '@utils/validator.util.js';
import { type RequestHandler } from 'express';

export type ControllerHandlers = {
	[key: string]: RequestHandler;
};

/**
 * ControllerBase - Clase base para todos los controladores
 * Proporciona manejo automático de errores, query parsing y formato de respuesta
 */
export abstract class ControllerBase {
	protected controllerName: string;
	private readonly baseMethods = new Set<string | symbol>();

	// Contexto de la solicitud actual
	private currentRequest: Request | null = null;
	private currentResponse: Response | null = null;
	private currentNext: NextFunction | null = null;
	private queryFilters: ProcessedQueryFilters | undefined | null;
	private requestStartTime: number = 0;

	constructor() {
		this.controllerName = this.constructor.name;

		this.identifyBaseMethods();

		// Crear proxy que envuelve automáticamente los métodos
		return this.createControllerProxy();
	}

	identifyBaseMethods(): void {
		// 1. Obtener el prototipo actual de esta instancia
		const basePrototype = Object.getPrototypeOf(this);

		// 2. Comenzar a recorrer la cadena de prototipos
		let currentPrototype = basePrototype;

		while (currentPrototype && currentPrototype !== Object.prototype) {
			// 3. Obtener todas las propiedades del prototipo actual
			const propertyNames = Object.getOwnPropertyNames(currentPrototype);

			// 4. Analizar cada propiedad
			for (const prop of propertyNames) {
				// Solo consideramos funciones que no sean el constructor
				if (prop !== 'constructor' && typeof (currentPrototype as any)[prop] === 'function') {
					// 5. Verificar si estamos en ControllerBase o sus ancestros
					if (
						currentPrototype === ControllerBase.prototype ||
						currentPrototype.constructor.name === 'ControllerBase'
					) {
						// Este método pertenece a ControllerBase
						this.baseMethods.add(prop);
					}
				}
			}

			// 6. Si llegamos a ControllerBase, detenemos el recorrido
			if (currentPrototype === ControllerBase.prototype) break;

			// 7. Subir al siguiente prototipo en la cadena
			currentPrototype = Object.getPrototypeOf(currentPrototype);
		}
	}

	/**
	 * Crea un proxy que intercepta llamadas a métodos públicos
	 */
	private createControllerProxy(): this {
		const handler: ProxyHandler<this> = {
			get: (target: this, prop: string | symbol, receiver: any) => {
				const originalMethod = Reflect.get(target, prop, receiver);

				// Determinar si el método debe ser envuelto
				const shouldWrapMethod = this.shouldWrapMethod(prop, originalMethod);

				if (shouldWrapMethod && typeof originalMethod === 'function') {
					return async (...args: any[]): Promise<any> => {
						const boundMethod = () => originalMethod.apply(target, args);
						return this.executeWithWrapper(boundMethod, args);
					};
				}

				return originalMethod;
			},
		};

		return new Proxy(this, handler);
	}

	/**
	 * Determina si un método debe ser envuelto por el proxy
	 */
	private shouldWrapMethod(prop: string | symbol, method: any): boolean {
		// Solo envolver si:
		// 1. Es una función
		// 2. No es el constructor
		// 3. No empieza con _ (privado)
		// 4. No es una propiedad getter/setter
		// 5. No envolver métodos de la clase base
		return (
			typeof method === 'function' &&
			prop !== 'constructor' &&
			!prop.toString().startsWith('_') &&
			!prop.toString().startsWith('get ') &&
			!prop.toString().startsWith('set ') &&
			!this.baseMethods.has(prop)
		);
	}

	/**
	 * Ejecuta un método con el wrapper de manejo de contexto
	 */
	private async executeWithWrapper(method: Function, args: any[]): Promise<any> {
		// Extraer req, res, next de los argumentos
		const [req, res, next] = args as [Request, Response, NextFunction];

		// Configurar contexto de ejecución
		this.setupExecutionContext(req, res, next);

		try {
			// 1. Procesar query parameters
			this.processQueryFilters(req);

			// 2. Ejecutar método del controlador
			const result = await method(...args);

			// 3. Manejar respuesta si no se ha hecho
			this.handleResponseIfNeeded(result);

			return result;
		} catch (error) {
			// 4. Manejar errores
			this.handleError(error);
		} finally {
			// 5. Limpiar contexto
			this.cleanupExecutionContext();
		}
	}

	/**
	 * Configura el contexto de ejecución para esta solicitud
	 */
	private setupExecutionContext(req: Request, res: Response, next: NextFunction): void {
		this.requestStartTime = Date.now();
		this.currentRequest = req;
		this.currentResponse = res;
		this.currentNext = next;
		this.queryFilters = null;

		// Asegurar que req tenga la propiedad filters
		if (!req.filters) req.filters = undefined;
	}

	/**
	 * Procesa los query parameters y construye los filtros
	 */
	private processQueryFilters(req: Request): void {
		this.queryFilters = QueryBuilder.buildFromQuery(req.query);
		req.filters = this.queryFilters;
	}

	/**
	 * Maneja la respuesta automáticamente si el método no lo hizo
	 */
	private handleResponseIfNeeded(result: any): void {
		if (this.currentResponse && this.currentResponse.headersSent) return;

		// Solo manejar si hay un resultado y no es un stream
		if (result !== undefined && this.currentResponse && !this.isStreamResponse(result)) {
			this.sendAutoResponse(result);
		} else {
			// Solo lanzamos error si no se envió nada Y tampoco se retornó nada
			throw new ProblematicResponseError(
				`No se preparó ninguna respuesta en un método de ${this.controllerName}`,
			);
		}
	}

	/**
	 * Verifica si el resultado es un stream o respuesta especial
	 */
	private isStreamResponse(result: any): boolean {
		return (
			result &&
			(typeof result.pipe === 'function' || // Stream
				(result.headers && typeof result.send === 'function') || // Response object
				typeof result.end === 'function') // Response-like
		);
	}

	/**
	 * Envía respuesta automática formateada
	 */
	private sendAutoResponse(result: any): void {
		if (!this.currentResponse) return;

		const processed = QueryBuilder.processResponse(result, this.queryFilters);
		const executionTime = Date.now() - this.requestStartTime;

		const response: ApiResponse = {
			success: true,
			message: 'Operation completed successfully',
			data: processed.data,
			metadata: processed.metadata,
		};

		// Agregar tiempo de ejecución en desarrollo
		if (process.env.APP_ENV === 'development') (response as any).executionTime = `${executionTime}ms`;
		this.currentResponse.status(200).json(response);
	}

	/**
	 * Normaliza cualquier error a AppError
	 */
	private normalizeError(error: any): AppError {
		// Verificar usando instanceof o estructuralmente (duck typing para entornos de tests aislados como Jest)
		if (
			error instanceof AppError ||
			(error &&
				typeof error === 'object' &&
				typeof error.statusCode === 'number' &&
				typeof error.code === 'string')
		) {
			return error;
		}

		// Si es Error de JavaScript, convertirlo
		if (error instanceof Error) {
			return new UnknownError(error, {
				controller: this.constructor.name,
				path: this.currentRequest?.path,
				method: this.currentRequest?.method,
			});
		}

		// Para cualquier otro tipo
		const errorMessage = typeof error === 'object' ? JSON.stringify(error) : String(error);

		return new UnknownError(new Error(errorMessage), {
			controller: this.constructor.name,
			originalValue: error,
			timestamp: new Date().toISOString(),
		});
	}

	/**
	 * Maneja errores de forma consistente
	 */
	private handleError(error: any): void {
		const normalizedError = this.normalizeError(error);

		if (this.currentNext) this.currentNext(normalizedError);
		else throw normalizedError;
	}

	/**
	 * Limpia el contexto de ejecución
	 */
	private cleanupExecutionContext(): void {
		this.currentRequest = null;
		this.currentResponse = null;
		this.currentNext = null;
		this.queryFilters = null;
		this.requestStartTime = 0;
	}

	/**
	 * Envía respuesta exitosa formateada
	 */
	protected success<T = any>(
		data: T,
		message: string = 'Success',
		statusCode: number = 200,
		metadata?: PaginationMetadata,
	): void {
		if (!this.currentResponse || this.currentResponse.headersSent) {
			console.warn(`[ControllerBase] Cannot send success response - headers already sent`);
			return;
		}

		const response: ApiResponse<T> = {
			success: true,
			message,
			data,
			metadata,
		};

		this.currentResponse.status(statusCode).json(response);
	}

	/**
	 * Envía respuesta 201 (Created)
	 */
	protected created<T = any>(data: T, message: string = 'Resource created successfully'): void {
		this.success(data, message, 201);
	}

	/**
	 * Envía respuesta 200 (Updated)
	 */
	protected updated<T = any>(data: T, message: string = 'Resource updated successfully'): void {
		this.success(data, message, 200);
	}

	/**
	 * Envía respuesta 204 (No Content)
	 */
	protected noContent(message: string = 'No content'): void {
		this.success(null, message, 204);
	}

	/**
	 * Establece una cookie de forma estandarizada en la respuesta
	 */
	protected setCookie(name: string, value: string, options: CookieOptions = {}): void {
		const defaultOptions: CookieOptions = {
			httpOnly: true,
			secure: true,
			sameSite: 'none',
			path: '/',
		};

		this.getResponse().cookie(name, value, { ...defaultOptions, ...options });
	}

	/**
	 * Elimina una cookie de forma estandarizada de la respuesta
	 */
	protected clearCookie(name: string, options: CookieOptions = {}): void {
		const defaultOptions: CookieOptions = {
			httpOnly: true,
			secure: true,
			sameSite: 'none',
			path: '/',
		};

		this.getResponse().clearCookie(name, { ...defaultOptions, ...options });
	}

	/**
	 * Obtiene los filtros de query procesados
	 */
	protected getQueryFilters(): ProcessedQueryFilters {
		if (this.queryFilters) return this.queryFilters;

		return {
			pagination: { offset: 0, limit: 10 },
			order: [],
			qc: {},
			raw: {},
		};
	}

	/**
	 * Obtiene opciones de paginación
	 */
	protected getPagination(): ProcessedQueryFilters['pagination'] {
		return this.getQueryFilters().pagination;
	}

	/**
	 * Obtiene opciones de ordenamiento
	 */
	protected getOrder(): ProcessedQueryFilters['order'] {
		return this.getQueryFilters().order;
	}

	/**
	 * Obtiene el request actual
	 */
	protected getRequest(): Request {
		if (!this.currentRequest) throw new Error('No request available in current context');

		return this.currentRequest;
	}

	/**
	 * Obtiene el response actual
	 */
	protected getResponse(): Response {
		if (!this.currentResponse) throw new Error('No response available in current context');

		return this.currentResponse;
	}

	/**
	 * Obtiene parámetros de la ruta
	 */
	protected getParams(): Record<string, any> {
		return this.getRequest().params;
	}

	/**
	 * Obtiene parámetros de query
	 */
	protected getQuery(): Record<string, any> {
		return this.getRequest().query;
	}

	/**
	 * Obtiene el cuerpo de la solicitud
	 */
	protected getBody<T = any>(): T {
		return this.getRequest().body;
	}

	/**
	 * Obtiene headers de la solicitud
	 */
	protected getHeaders(): Record<string, any> {
		return this.getRequest().headers;
	}

	/**
	 * Obtiene el usuario autenticado (si existe)
	 */
	protected getSession<T = any>(): T | null {
		const req = this.getRequest();
		return (req as any).session || null;
	}

	protected isTestingRequest(): boolean {
		return /^\/api\/v\d+\/test\//.test(this.getRequest().baseUrl);
	}

	/**
	 * Valida que exista un parámetro requerido
	 */
	protected requireParam(paramName: string): any {
		const value = Validator.requireArg(this.getRequest().params, paramName);

		return value;
	}

	/**
	 * Valida que exista un query parameter requerido
	 */
	protected requireQuery(paramName: string): any {
		const value = Validator.requireArg(this.getRequest().query, paramName);

		return QueryBuilder.parseValue(value);
	}

	/**
	 * Valida que exista un campo en el body requerido
	 */
	protected requireBodyField(fieldName: string): any {
		const value = Validator.requireArg(this.getRequest().body, fieldName);

		return value;
	}
}
