import { type Request, type Response, type NextFunction } from 'express';
import { AppConfig } from '@config/app.config.js';
import { JWTUtil } from '@utils/jwt.util.js';
import { AuthError, ForbiddenError, ConflictError, ValidationError } from '@errors';
import { SessionNotFoundError } from '@errors/auth.error.js';
import { UserSession } from '@rules/api.type.js';

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

    static buildSession(session: any): Partial<UserSession> {
        return {
            userId: session.userId || session.sub,
            email: session.email,
            role: session.role,
            permissions: Array.isArray(session.permissions) ? session.permissions : [],
            ...session,
        };
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
     * Extraer token de la request strictly obeying AUTH_TRANSPORT
     */
    private static extractToken(req: Request, tokenType?: 'access' | 'refresh'): string | null {
        const security = AppConfig.load().security;
        const transmissionMethod = security.authTransport;

        if (transmissionMethod === 'bearer') {
            const authHeader = req.header(this.config.headerName!);
            if (authHeader?.startsWith('Bearer ')) return authHeader.slice(7);
        }

        if (transmissionMethod === 'cookie') {
            const cookieName = tokenType === 'refresh' ? security.jwtCookieRefreshName : security.jwtCookieAccessName;
            return req.cookies ? req.cookies[cookieName] : null;
        }

        return null;
    }

    /**
     * 1. Verificar y obtener datos de la sesión
     */
    static verifySession(req: Request, _res: Response, next: NextFunction): void {
        try {
            const token = this.extractToken(req);

            if (!token) throw new AuthError('Token de autenticación no encontrado', { code: 'TOKEN_NOT_FOUND' });

            const session = JWTUtil.verifyToken(token);

            if (!session) throw new AuthError('Token inválido', { code: 'TOKEN_INVALID' });

            // Validar estructura básica
            if (!session.userId && !session.sub)
                throw new AuthError('Token no contiene identificador de usuario', { code: 'INVALID_TOKEN_PAYLOAD' });

            // Establecer sesión
            req.session = {
                userId: session.userId || session.sub,
                email: session.email,
                role: session.role,
                permissions: Array.isArray(session.permissions) ? session.permissions : [],
                ...session,
            };

            next();
        } catch (error) {
            if (error instanceof AuthError) next(error);
            else if (error instanceof Error) {
                if (error.message === 'Token has expired')
                    next(new AuthError('El token de sesión ha expirado', { code: 'TOKEN_EXPIRED' }));
                else if (error.message === 'Invalid token type')
                    next(new AuthError('El tipo de token es inválido', { code: 'INVALID_TOKEN' }));
                else next(new AuthError(`Error de autenticación: ${error.message}`, { code: 'AUTH_FAILED' }));
            } else next(new AuthError('Error de autenticación desconocido', { code: 'UNKNOWN_AUTH_ERROR' }));
        }
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

                if (!req.session.role)
                    throw new ForbiddenError('Usuario no tiene rol asignado', { code: 'NO_ROLE_ASSIGNED' });

                const requiredRoles = Array.isArray(role) ? role : [role];
                const userRole = req.session.role.toUpperCase();

                const hasRequiredRole = requiredRoles.some((r) => r.toUpperCase() === userRole);

                if (!hasRequiredRole) {
                    throw new ForbiddenError(`Usuario no tiene el rol necesario para realizar esta acción`, {
                        code: 'INSUFFICIENT_ROLE',
                    });
                }

                next();
            } catch (error) {
                next(error);
            }
        };
    }

    /**
     * 4. Prevenir login doble
     */
    static preventDoubleLogin(req: Request, _res: Response, next: NextFunction): void {
        try {
            const token = this.extractToken(req);

            if (token) {
                // Verificar si el token es válido (no expirado)
                try {
                    JWTUtil.verifyToken(token);
                    throw new ConflictError('Ya tienes una sesión activa', 'ACTIVE_SESSION_EXISTS');
                } catch (error) {
                    // Si el token está expirado o es inválido, permitir login
                    if (error instanceof Error && error.message.includes('expired')) {
                        next();
                        return;
                    }
                    // Otros errores de token también permiten login
                    next();
                    return;
                }
            }

            next();
        } catch (error) {
            next(error);
        }
    }

    /**
     * Middleware opcional de autenticación (no falla si no hay token)
     */
    static optionalAuth(req: Request, _res: Response, next: NextFunction): void {
        try {
            const token = this.extractToken(req);

            if (token) {
                try {
                    const session = JWTUtil.verifyToken(token);

                    if (session) {
                        req.session = {
                            userId: session.userId || session.sub,
                            email: session.email,
                            role: session.role,
                            permissions: Array.isArray(session.permissions) ? session.permissions : [],
                            ...session,
                        };
                    }
                } catch {
                    // Ignorar errores de token en autenticación opcional
                }
            }

            next();
        } catch {
            next(); // Siempre continuar en optionalAuth
        }
    }
}

// Exportar funciones individuales para uso directo
export const verifySession = AuthMiddleware.verifySession.bind(AuthMiddleware);
export const verifyPermission = AuthMiddleware.verifyPermission;
export const preventDoubleLogin = AuthMiddleware.preventDoubleLogin.bind(AuthMiddleware);
export const verifyRole = AuthMiddleware.verifyRole;
export const optionalAuth = AuthMiddleware.optionalAuth.bind(AuthMiddleware);

export default AuthMiddleware;
