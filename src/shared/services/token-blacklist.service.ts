import { CacheDatabaseProvider } from '@providers/cache-database.provider.js';
import JWTUtil from '@utils/jwt.util.js';

class TokenBlacklistService {
	private readonly keyPrefix = 'auth:bl:';

	private get client() {
		return CacheDatabaseProvider.getInstance().client;
	}

	async blacklistTokenAtRefresh(token: string): Promise<boolean> {
		const decoded = JWTUtil.decodeToken(token) as { exp?: number; jti?: string } | null;

		if (!decoded || !decoded.exp || !decoded.jti) return false;

		const now = Math.floor(Date.now() / 1000);
		const ttlInSeconds = decoded.exp - now;

		if (ttlInSeconds <= 0) return false;

		const key = `${this.keyPrefix}${decoded.jti}`;

		const result = await this.client.set(key, 'blacklisted', 'EX', ttlInSeconds, 'NX');

		return result === 'OK';
	}

	async isBlacklisted(token: string): Promise<boolean> {
		const decoded = JWTUtil.decodeToken(token) as { jti?: string } | null;
		if (!decoded || !decoded.jti) return true;

		const key = `${this.keyPrefix}${decoded.jti}`;
		const isSelfBlacklisted = await this.client.get(key);

		return isSelfBlacklisted === 'blacklisted';
	}

	async blacklistToken(token: string): Promise<void> {
		await this.blacklistTokenAtRefresh(token);
	}
}

export const tokenBlacklistService = new TokenBlacklistService();
