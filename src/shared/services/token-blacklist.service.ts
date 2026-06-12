import { CacheDatabaseProvider } from '@providers/cache-database.provider.js';
import JWTUtil from '@utils/jwt.util.js';

class TokenBlacklistService {
	private readonly keyPrefix = 'auth:bl:';

	private get client() {
		return CacheDatabaseProvider.getInstance().client;
	}

	async blacklistJti(jti: string, expiresAtUnix: number): Promise<boolean> {
		const now = Math.floor(Date.now() / 1000);
		const ttlInSeconds = expiresAtUnix - now;

		if (ttlInSeconds <= 0) return false;

		const key = `${this.keyPrefix}${jti}`;
		const result = await this.client.set(key, 'blacklisted', 'EX', ttlInSeconds, 'NX');

		return result === 'OK';
	}

	async blacklistTokenAtRefresh(token: string): Promise<boolean> {
		if (!token) return false;

		let isJwt = token.split('.').length === 3;
		let decoded: any = null;

		if (isJwt) {
			decoded = JWTUtil.decodeToken(token) as { exp?: number; jti?: string } | null;
			
			// Si es un JWT pero le falta jti o exp, o no decodifica (ej. un token opaco que casualmente tenía dos puntos),
			// invalidamos la bandera isJwt para tratarlo como un token puro.
			if (!decoded || !decoded.jti || !decoded.exp) {
				isJwt = false;
			}
		}

		let jti: string;
		let ttlInSeconds: number;

		if (isJwt) {
			jti = decoded.jti;
			const now = Math.floor(Date.now() / 1000);
			ttlInSeconds = decoded.exp - now;
		} else {
			// Es un raw token opaco (refresh token)
			jti = token;
			ttlInSeconds = Math.floor(JWTUtil.getRefreshExpiresInMs() / 1000);
		}

		if (ttlInSeconds <= 0) return false;

		const key = `${this.keyPrefix}${jti}`;
		const result = await this.client.set(key, 'blacklisted', 'EX', ttlInSeconds, 'NX');

		return result === 'OK';
	}

	async isBlacklisted(token: string): Promise<boolean> {
		// Este método solo se llama para Access Tokens (JWT) según auth.middleware.ts
		const decoded = JWTUtil.decodeToken(token) as { jti?: string } | null;
		if (!decoded || !decoded.jti) return true; // Si es inválido, lo tratamos como revocado

		const key = `${this.keyPrefix}${decoded.jti}`;
		const isSelfBlacklisted = await this.client.get(key);

		return isSelfBlacklisted === 'blacklisted';
	}

	async blacklistToken(token: string): Promise<void> {
		await this.blacklistTokenAtRefresh(token);
	}
}

export const tokenBlacklistService = new TokenBlacklistService();
