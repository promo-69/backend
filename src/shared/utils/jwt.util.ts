import jwt from 'jsonwebtoken';
import { AppConfig } from '@config/app.config.js';

export interface JWTPayload {
    [key: string]: any;
    iat?: number;
    exp?: number;
    type?: string;
}

export class JWTUtil {
    private static SECRET: string;
    private static REFRESH_SECRET: string;
    private static EXPIRES_IN: jwt.SignOptions['expiresIn'] = '7d';
    private static REFRESH_EXPIRES_IN: jwt.SignOptions['expiresIn'] = '30d';

    static {
        const security = AppConfig.load().security;

        if (!security.jwtSecret || security.jwtSecret === '')
            throw new Error('JWT_SECRET environment variable is not defined for production');

        this.SECRET = security.jwtSecret;
        this.REFRESH_SECRET = security.jwtRefreshSecret;
        if (security.jwtAccessExpiresIn) this.EXPIRES_IN = security.jwtAccessExpiresIn as jwt.SignOptions['expiresIn'];
        if (security.jwtRefreshExpiresIn)
            this.REFRESH_EXPIRES_IN = security.jwtRefreshExpiresIn as jwt.SignOptions['expiresIn'];
    }

    static getAccessExpiresInMs(): number {
        return this.parseExpiryToMs(this.EXPIRES_IN as string);
    }

    static getRefreshExpiresInMs(): number {
        return this.parseExpiryToMs(this.REFRESH_EXPIRES_IN as string);
    }

    private static parseExpiryToMs(expiry: string): number {
        if (!expiry) return 3600000;
        const match = expiry.match(/^(\d+)([smhd])$/);
        if (!match) return 3600000;
        const value = parseInt(match[1], 10);
        const unit = match[2];
        switch (unit) {
            case 's':
                return value * 1000;
            case 'm':
                return value * 60 * 1000;
            case 'h':
                return value * 60 * 60 * 1000;
            case 'd':
                return value * 24 * 60 * 60 * 1000;
            default:
                return 3600000;
        }
    }

    static generateToken(payload: Omit<JWTPayload, 'type'>): string {
        return jwt.sign(
            {
                ...payload,
                type: 'access',
                iat: Math.floor(Date.now() / 1000),
            },
            this.SECRET,
            { expiresIn: this.EXPIRES_IN },
        );
    }

    static verifyToken<T = JWTPayload>(token: string): T {
        try {
            const decoded = jwt.verify(token, this.SECRET) as T;
            if ((decoded as any).type !== 'access') throw new Error('Invalid token type');
            return decoded;
        } catch (error) {
            if (error instanceof jwt.TokenExpiredError) throw new Error('Token has expired');
            else if (error instanceof jwt.JsonWebTokenError) throw new Error('Invalid token');

            throw new Error('Token verification failed');
        }
    }

    static decodeToken<T = JWTPayload>(token: string): T | null {
        try {
            return jwt.decode(token) as T;
        } catch {
            return null;
        }
    }

    static generateRefreshToken(payload: Omit<JWTPayload, 'type'>): string {
        return jwt.sign(
            {
                ...payload,
                type: 'refresh',
                iat: Math.floor(Date.now() / 1000),
            },
            this.REFRESH_SECRET,
            { expiresIn: this.REFRESH_EXPIRES_IN },
        );
    }

    static verifyRefreshToken<T = JWTPayload>(token: string): T {
        try {
            const decoded = jwt.verify(token, this.REFRESH_SECRET) as T;

            if ((decoded as any).type !== 'refresh') throw new Error('Invalid token type');

            return decoded;
        } catch (error) {
            if (error instanceof jwt.TokenExpiredError) throw new Error('Refresh token has expired');
            else if (error instanceof jwt.JsonWebTokenError) throw new Error('Invalid refresh token');

            throw new Error('Refresh token verification failed');
        }
    }

    // Método para extraer el token de un header Authorization
    static extractToken(authHeader: string | undefined): string | null {
        if (!authHeader) return null;

        const parts = authHeader.split(' ');
        if (parts.length !== 2 || parts[0] !== 'Bearer') return null;

        return parts[1];
    }

    // Método para generar un token con expiración personalizada
    static generateTokenWithExpiry(payload: JWTPayload, expiresIn: jwt.SignOptions['expiresIn']): string {
        return jwt.sign(
            {
                ...payload,
                iat: Math.floor(Date.now() / 1000),
            },
            this.SECRET,
            { expiresIn },
        );
    }

    // Método para verificar si un token está a punto de expirar
    static isTokenExpiringSoon(token: string, thresholdSeconds: number = 3600): boolean {
        const decoded = this.decodeToken(token);

        if (!decoded || !decoded.exp) return false;

        const now = Math.floor(Date.now() / 1000);
        const timeUntilExpiry = decoded.exp - now;

        return timeUntilExpiry <= thresholdSeconds;
    }

    // Método para obtener el tiempo restante de un token en segundos
    static getTokenRemainingTime(token: string): number | null {
        const decoded = this.decodeToken(token);

        if (!decoded || !decoded.exp) return null;

        const now = Math.floor(Date.now() / 1000);
        return Math.max(0, decoded.exp - now);
    }
}

// Exportar por defecto
export default JWTUtil;
