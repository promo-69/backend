import { type Request, type Response, type NextFunction } from 'express';
import { AppConfig } from '@config/app.config.js';
import { JWTPayload, JWTUtil } from '@utils/jwt.util.js';
import { AuthError, ForbiddenError, ConflictError, ValidationError } from '@errors';
import { SessionNotFoundError } from '@errors/auth.error.js';
import { UserSession } from '@rules/api.type.js';
import { tokenBlacklistService } from '@services/token-blacklist.service.js';

interface AuthConfig {
	cookieNames?: string[];
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

	static configure(config: Partial<AuthConfig>): void {
		this.config = { ...this.DEFAULT_CONFIG, ...config };

		if (!this.config.headerName && (!this.config.cookieNames || this.config.cookieNames.length === 0))
			throw new ValidationError('Debe configurar al menos cookieNames o headerName', [], {
				code: 'AUTH_CONFIG_INVALID',
			});
	}

	private static extractToken(req: Request, tokenType: 'access' | 'refresh' = 'access'): string | null {
		const security = AppConfig.load().security;

		const cookieName = tokenType === 'refresh' ? security.jwtCookieRefreshName : security.jwtCookieAccessName;
		const cookieToken = req.cookies ? req.cookies[cookieName] : null;

		if (cookieToken) return cookieToken;

		const authHeader = req.header(this.config.headerName!);

		if (authHeader?.startsWith('Bearer ')) return authHeader.slice(7);

		return null;
	}

	private static parseCookieHeader(cookieHeader: string): Record<string, string> {
		return cookieHeader
			.split(';')
			.map((part) => part.trim())
			.reduce((result: Record<string, string>, pair) => {
				const [key, ...valueParts] = pair.split('=');
				if (!key) return result;
				result[key.trim()] = decodeURIComponent(valueParts.join('=') || '');
				return result;
			}, {});
	}

	private static extractTokenFromSocket(socket: any, tokenType: 'access' | 'refresh' = 'access'): string | null {
		const security = AppConfig.load().security;
		const cookieName = tokenType === 'refresh' ? security.jwtCookieRefreshName : security.jwtCookieAccessName;

		const cookieHeader = socket.handshake?.headers?.cookie;
		if (typeof cookieHeader === 'string') {
			const cookies = this.parseCookieHeader(cookieHeader);
			if (cookies[cookieName]) return cookies[cookieName];
		}

		const authHeader = socket.handshake?.auth?.token || socket.handshake?.headers?.authorization;

		if (typeof authHeader === 'string') {
			if (authHeader.startsWith('Bearer ')) return authHeader.slice(7);
			return authHeader;
		}

		return null;
	}

	/**
	 * Middleware de autenticación para Socket.IO.
	 */
	static async socketAuth(socket: any, next: (err?: Error) => void): Promise<void> {
		try {
			const token = this.extractTokenFromSocket(socket, 'access');
			if (!token) throw new AuthError('Token de autenticación no encontrado', { code: 'TOKEN_NOT_FOUND' });

			const payload = JWTUtil.verifyToken(token) as JWTPayload & UserSession & { iat: number };
			if (!payload || !payload.userId || !payload.type)
				throw new AuthError('Token inválido', { code: 'TOKEN_INVALID' });

			const isBlacklisted = await tokenBlacklistService.isBlacklisted(token);
			if (isBlacklisted)
				throw new AuthError('Sesión ha expirado o ha sido revocada por seguridad', { code: 'TOKEN_REVOKED' });

			socket.data = socket.data || {};
			socket.data.session = AuthMiddleware.buildSession(payload);
			socket.data.token = token;
			next();
		} catch (error: any) {
			next(error instanceof Error ? error : new Error('Autenticación de socket fallida'));
		}
	}

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

	static async verifySession(req: Request, _res: Response, next: NextFunction): Promise<void> {
		try {
			const result = await AuthMiddleware.getValidatedSession(req);

			req.session = result.session;
			req.token = result.token;

			next();
		} catch (error) {
			next(error);
		}
	}

	static async optionalAuth(req: Request, _res: Response, next: NextFunction): Promise<void> {
		try {
			const result = await AuthMiddleware.getValidatedSession(req);

			req.session = result.session;
			req.token = result.token;
		} catch (error) {}

		next();
	}

	static verifyPermission(permission: string | string[]) {
		return (req: Request, _res: Response, next: NextFunction): void => {
			try {
				if (!req.session) throw new SessionNotFoundError();

				// Bypass para SUPER_ADMIN
				if (req.session.roleCode === 'SUPER_ADMIN') {
					return next();
				}

				const userPermissions = (req.session.permissions || []).map((p: any) => p.toUpperCase());

				let requiredPermissions: string[] = [];
				if (typeof permission === 'string') requiredPermissions.push(permission.toUpperCase());
				else if (Array.isArray(permission)) requiredPermissions = permission.map((p) => p.toUpperCase());
				else
					throw new ValidationError('Formato de permisos inválido. Debe ser string o array de strings', [], {
						code: 'INVALID_PERMISSION_FORMAT',
					});

				const hasAllPermissions = requiredPermissions.every((perm) => userPermissions.includes(perm));

				if (!hasAllPermissions)
					throw new ForbiddenError('Usuario no tiene los permisos necesarios para realizar esta acción', {
						code: 'INSUFFICIENT_PERMISSIONS',
					});

				next();
			} catch (error) {
				next(error);
			}
		};
	}

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

	static async preventAuthenticatedAccess(req: Request, _res: Response, next: NextFunction): Promise<void> {
		try {
			const token = this.extractToken(req, 'access');

			if (!token) return next();

			const session = JWTUtil.verifyToken(token) as JWTPayload & UserSession & { iat: number };

			const isBlacklisted = await tokenBlacklistService.isBlacklisted(token);

			if (session && !isBlacklisted)
				return next(new ConflictError('Ya tienes una sesión activa', 'ACTIVE_SESSION_EXISTS'));

			next();
		} catch (error) {
			next();
		}
	}
}

export const verifySession = AuthMiddleware.verifySession.bind(AuthMiddleware);
export const optionalAuth = AuthMiddleware.optionalAuth.bind(AuthMiddleware);
export const verifyPermission = AuthMiddleware.verifyPermission;
export const verifyRole = AuthMiddleware.verifyRole;
export const preventAuthenticatedAccess = AuthMiddleware.preventAuthenticatedAccess.bind(AuthMiddleware);
export const socketAuth = AuthMiddleware.socketAuth.bind(AuthMiddleware);

export default AuthMiddleware;
