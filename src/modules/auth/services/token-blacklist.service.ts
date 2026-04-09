import { RedisProvider } from '@providers/redis.provider.js';
import jwt from 'jsonwebtoken';

class TokenBlacklistService {
    private readonly keyPrefix = 'auth:bl:';

    private get redisClient() {
        return RedisProvider.getInstance().client;
    }

    /**
     * Intenta bloquear atómicamente un token con SETNX y un TTL dinámico.
     * Previene Race Conditions si múltiples peticiones simultáneas intentan refrescar el mismo token.
     * @param token JWT crudo a invalidar
     * @returns `true` si el token fue añadido (lock exclusivo logrado). `false` si el token expiró o ya estaba siendo bloqueado por otra petición concurrente.
     */
    async blacklistTokenAtRefresh(token: string): Promise<boolean> {
        const decoded = jwt.decode(token) as { exp?: number; jti?: string } | null;
        
        if (!decoded || !decoded.exp) {
            // Token de estructura inválida o sin exp
            return false;
        }

        const now = Math.floor(Date.now() / 1000);
        const ttlInSeconds = decoded.exp - now;

        if (ttlInSeconds <= 0) {
            // El token expiró de forma natural, no se bloquea explícitamente porque el JWT en sí ya es inválido.
            // Retorna false impidiendo que la persona continúe con un refresco.
            return false;
        }

        const key = `${this.keyPrefix}${token}`;

        // Operación atómica nativa en Redis:
        // Set (NX: Not eXists, EX: Expires at TTL seconds)
        // Devuelve 'OK' (1) si insertó exitosamente; null (0) si la llave ya existía (Race condition block)
        const result = await this.redisClient.set(key, 'blacklisted', 'EX', ttlInSeconds, 'NX');

        return result === 'OK';
    }

    /**
     * REQUERIMIENTO 3: Invalida globalmente la sesión de un usuario (Robo generalizado o Single Active Session)
     */
    async invalidateUserSessions(userId: number | string): Promise<void> {
        const key = `auth:revoked:${userId}`;
        const now = Math.floor(Date.now() / 1000);
        // Expiración en 30 días para cubrir la vida de tu JWT_REFRESH_EXPIRES_IN (30d de app.config)
        await this.redisClient.set(key, now.toString(), 'EX', 30 * 24 * 60 * 60);
    }
    /**
     * REQUERIMIENTO 1 y 3: Verifica si un token individual O el usuario global están bloqueados
     */
    async isBlacklisted(token: string, payload?: { iat?: number; userId?: number | string | any }): Promise<boolean> {
        // 1. Verificación individual en Redis (Robo singular o Logout)
        const key = `${this.keyPrefix}${token}`;
        const isSelfBlacklisted = await this.redisClient.get(key);
        if (isSelfBlacklisted === 'blacklisted') return true;
        if (!payload || !payload.userId || !payload.iat) return false;
        // 2. Verificación global (Single Active Session)
        const revokedKey = `auth:revoked:${payload.userId}`;
        const revokedTimestamp = await this.redisClient.get(revokedKey);
        if (revokedTimestamp) {
            // Si la fecha de emisión (iat) es estrictamente anterior al momento en que
            // se destituyeron las credenciales globales, el token es inválido.
            if (payload.iat < parseInt(revokedTimestamp, 10)) return true;
        }
        return false;
    }

    /**
     * Bloquea el token ignorando resultados de condiciones de carrera. 
     * Ideal para el logout estándar sin rotación de credenciales.
     */
    async blacklistToken(token: string): Promise<void> {
        await this.blacklistTokenAtRefresh(token);
    }
}

export const tokenBlacklistService = new TokenBlacklistService();
