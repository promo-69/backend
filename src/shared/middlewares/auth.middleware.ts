import { type Request, type Response, type NextFunction } from 'express';
import { AppConfig } from '@config/app.config.js';
import { JWTPayload, JWTUtil } from '@utils/jwt.util.js';
import { AuthError, ForbiddenError, ConflictError, ValidationError } from '@errors';
import { SessionNotFoundError } from '@errors/auth.error.js';
import { UserSession } from '@rules/api.type.js';
import { tokenBlacklistService } from '@services/token-blacklist.service.js';

// Configuración simple
interface AuthConfig {
	/** Nombre de la cookie (si se usan cookies) */
	cookieNames?: string[];
	/** Nombre del header (si se usan headers) */
	headerName?: string;
}

export class AuthMiddleware {
	private static readonly DEFAULT_CONFIG: AuthConfig = {
		cookieNames: ['at', 'rt'],
		headerName: 'Authorization',
	};

	private static config: AuthConfig = this.DEFAULT_CONFIG;

	static buildSession(_session: any): UserSession {
		const session: Partial<UserSession> = {
			userId: _session.userId || _session.sub,
			documentNumber: _session.documentNumber,
			firstName: _session.firstName,
			lastName: _session.lastName,
			email: _session?.email,
			phoneNumber: _session?.phoneNumber,
			permissions: Array.isArray(_session.permissions) ? _session.permissions : [],
			roleCode: _session?.roleCode,
			roleDesc: _session?.roleDesc,
		};

		return session as UserSession;
	}

	/**
	 * Configurar globalmente el middleware
	 */
	static configure(config: Partial<AuthConfig>): void {
		this.config = { ...this.DEFAULT_CONFIG, ...config };

		if (!this.config.headerName && (!this.config.cookieNames || this.config.cookieNames.length === 0))
			throw new ValidationError('Debe configurar al menos cookieNames o headerName', [], {
				code: 'AUTH_CONFIG_INVALID',
			});
	}

	/**
	 * Extraer token de la request con Estrategia Omnicanal (Fallback: Cookie -> Header)
	 */
	private static extractToken(req: Request, tokenType: 'access' | 'refresh' = 'access'): string | null {
		const security = AppConfig.load().security;

		// 1. Prioridad 1 (Web): Buscar en las Cookies
		const cookieName = tokenType === 'refresh' ? security.jwtCookieRefreshName : security.jwtCookieAccessName;
		const cookieToken = req.cookies ? req.cookies[cookieName] : null;

		if (cookieToken) return cookieToken;

		// 2. Prioridad 2 (Móvil - Fallback): Buscar en la cabecera Authorization
		// El cliente móvil enviará el token adecuado (Access o Refresh) en este header según el endpoint
		const authHeader = req.header(this.config.headerName!);

		if (authHeader?.startsWith('Bearer ')) return authHeader.slice(7); // Retorna el token limpio

		// 3. No se encontró en ningún transporte
		return null;
	}

	/**
	 * Obtener sesión validada.
	 */
	private static async getValidatedSession(req: Request): Promise<{ session: UserSession; token: string }> {
		const token = this.extractToken(req, 'access');

		try {
			if (!token) throw new AuthError('Token de autenticación no encontrado', { code: 'TOKEN_NOT_FOUND' });

			const payload = JWTUtil.verifyToken(token) as JWTPayload & UserSession & { iat: number };

			if (!payload || !payload.userId || !payload.type)
				throw new AuthError('Token inválido', { code: 'TOKEN_INVALID' });

			const isBlacklisted = await tokenBlacklistService.isBlacklisted(token);
			if (isBlacklisted)
				throw new AuthError('Sesión ha expirado o ha sido revocada por seguridad', { code: 'TOKEN_REVOKED' });

			return {
				session: JWTUtil.getPayload(token) as UserSession,
				token,
			};
		} catch (error: any) {
			if (error instanceof AuthError) throw error;

			if (error.message === 'Token has expired')
				throw new AuthError('El token de sesión ha expirado', { code: 'TOKEN_EXPIRED' });

			if (error.message === 'Invalid token type')
				throw new AuthError('El tipo de token es inválido', { code: 'INVALID_TOKEN' });

			throw new AuthError(`Error de autenticación: ${error.message}`, { code: 'AUTH_FAILED' });
		}
	}

	/**
	 * 1. Verificar y obtener sesión (OBLIGATORIO)
	 */
	static async verifySession(req: Request, _res: Response, next: NextFunction): Promise<void> {
		try {
			const result = await AuthMiddleware.getValidatedSession(req);

			console.log(result);

			req.session = result.session;
			req.token = result.token;

			next();
		} catch (error) {
			next(error);
		}
	}

	/**
	 * 1.2. Verificar y obtener sesión (opcional)
	 */
	static async optionalAuth(req: Request, _res: Response, next: NextFunction): Promise<void> {
		try {
			const result = await AuthMiddleware.getValidatedSession(req);

			req.session = result.session;
			req.token = result.token;
		} catch (error) {}

		next();
	}

	/**
	 * 2. Verificar permiso
	 */
	static verifyPermission(permission: string | string[]) {
		return (req: Request, _res: Response, next: NextFunction): void => {
			try {
				if (!req.session) throw new SessionNotFoundError();

				const userPermissions = (req.session.permissions || []).map((p: any) => p.toUpperCase());

				// Normalizar permisos requeridos
				let requiredPermissions: string[] = [];

				if (typeof permission === 'string') requiredPermissions.push(permission.toUpperCase());
				else if (Array.isArray(permission)) requiredPermissions = permission.map((p) => p.toUpperCase());
				else
					throw new ValidationError('Formato de permisos inválido. Debe ser string o array de strings', [], {
						code: 'INVALID_PERMISSION_FORMAT',
					});

				// Verificar que el usuario tenga TODOS los permisos requeridos
				const hasAllPermissions = requiredPermissions.every((perm) => userPermissions.includes(perm));

				if (!hasAllPermissions) throw new ForbiddenError();

				next();
			} catch (error) {
				next(error);
			}
		};
	}

	/**
	 * 3. Verificar rol
	 */
	static verifyRole(role: string | string[]) {
		return (req: Request, _res: Response, next: NextFunction): void => {
			try {
				if (!req.session) throw new SessionNotFoundError();

				if (!req.session.roleCode)
					throw new ForbiddenError('Usuario no tiene rol asignado', { code: 'NO_ROLE_ASSIGNED' });

				const requiredRoles = Array.isArray(role) ? role : [role];
				const userRole = req.session.roleCode.toUpperCase();

				const hasRequiredRole = requiredRoles.some((r) => r.toUpperCase() === userRole);

				if (!hasRequiredRole)
					throw new ForbiddenError(`Usuario no tiene el rol necesario para realizar esta acción`, {
						code: 'INSUFFICIENT_ROLE',
					});

				next();
			} catch (error) {
				next(error);
			}
		};
	}

	/**
	 * 4. Prevenir que usuarios autenticados correctamente accedan a rutas.
	 */
	static async preventAuthenticatedAccess(req: Request, _res: Response, next: NextFunction): Promise<void> {
		try {
			const token = this.extractToken(req, 'access');

			// Si no hay token, puede pasar
			if (!token) return next();

			// 1. Verificar validez del token de sesión
			const session = JWTUtil.verifyToken(token) as JWTPayload & UserSession & { iat: number };

			// 2. Verificar si el token fue revocado
			const isBlacklisted = await tokenBlacklistService.isBlacklisted(token);

			// Si el token es válido Y NO está revocado, entonces SÍ tiene una sesión activa
			if (session && !isBlacklisted)
				return next(new ConflictError('Ya tienes una sesión activa', 'ACTIVE_SESSION_EXISTS'));

			// Si llegamos aquí, no hay una sesión correctamente iniciada.
			next();
		} catch (error) {
			// Cualquier error en la verificación significa que el usuario no está autenticado correctamente, por lo que puede pasar.
			next();
		}
	}
}

// Exportar funciones individuales para uso directo
export const verifySession = AuthMiddleware.verifySession.bind(AuthMiddleware);
export const optionalAuth = AuthMiddleware.optionalAuth.bind(AuthMiddleware);
export const verifyPermission = AuthMiddleware.verifyPermission;
export const verifyRole = AuthMiddleware.verifyRole;
export const preventAuthenticatedAccess = AuthMiddleware.preventAuthenticatedAccess.bind(AuthMiddleware);

export default AuthMiddleware;
