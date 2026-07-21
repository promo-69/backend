import { ControllerBase } from '@bases/controller.base.js';
import { AppConfig } from '@config/app.config.js';
import JWTUtil from '@utils/jwt.util.js';
import AuthService from './_.service.js';
import { UserSession } from '@rules/api.type.js';
import { nanoid } from 'nanoid';

class AuthController extends ControllerBase {
	constructor() {
		super();
	}

	private _getExpectedTransport(): 'cookie' | 'bearer' {
		const req = this.getRequest();
		const clientChannel = req.headers['x-client-channel'];
		if (clientChannel === 'web') return 'cookie';
		if (clientChannel === 'mobile') return 'bearer';

		const security = AppConfig.load().security;
		const refreshName = security.jwtCookieRefreshName || 'RT';
		if (req.cookies?.[refreshName]) return 'cookie';

		return 'bearer';
	}

	private _sendLoginResponse(loginResponse: { user: any; accessToken: string; refreshToken: string }) {
		const { user, accessToken, refreshToken } = loginResponse;
		const transport = this._getExpectedTransport();

		if (transport === 'cookie') {
			const security = AppConfig.load().security;
			const accessName = security.jwtCookieAccessName || 'AT';
			const refreshName = security.jwtCookieRefreshName || 'RT';
			const req = this.getRequest();

			this.setCookie(accessName, accessToken, { maxAge: JWTUtil.getAccessExpiresInMs() });
			this.setCookie(refreshName, refreshToken, {
				path: `${req.baseUrl}`,
				maxAge: JWTUtil.getRefreshExpiresInMs(),
			});
			return this.success({ user }, 'Autenticación exitosa');
		}

		return this.success({ user, tokens: { accessToken, refreshToken } }, 'Autenticación exitosa');
	}

	async getEmployeePermissions() {
		const data = (this.getRequest().session as UserSession).permissions;

		return this.success({ permissions: data }, 'Permisos obtenidos correctamente');
	}

	private _getDeviceData(): { deviceId: string; deviceInfo: string } {
		const req = this.getRequest();
		let deviceId = req.headers['x-device-id'];
		if (!deviceId || typeof deviceId !== 'string') deviceId = nanoid();

		const userAgent = req.headers['user-agent'] || 'Unknown-Agent';
		const ip = req.ip || 'Unknown-IP';
		const deviceInfo = `${userAgent}-${ip}`;

		return { deviceId, deviceInfo };
	}

	// --- Auth & Session ---

	async signup() {
		await AuthService.registerUser(this.getBody());

		return this.created(
			{},
			'Usuario registrado exitosamente. Por favor verifica tu correo electrónico con el código enviado.',
		);
	}

	async verifySignup() {
		await AuthService.verifySignupCode(this.getBody());

		return this.success({}, 'Cuenta verificada y autenticada exitosamente');
	}

	async login() {
		const deviceData = this._getDeviceData();
		const deviceString = deviceData.deviceId + (deviceData.deviceInfo ? ` - ${deviceData.deviceInfo}` : '');
		return this._sendLoginResponse(await AuthService.authenticateCustomer(this.getBody(), deviceString));
	}

	async loginAdmin() {
		const deviceData = this._getDeviceData();
		const deviceString = deviceData.deviceId + (deviceData.deviceInfo ? ` - ${deviceData.deviceInfo}` : '');
		return this._sendLoginResponse(await AuthService.authenticateEmployee(this.getBody(), deviceString));
	}

	async refresh() {
		const req = this.getRequest();
		const security = AppConfig.load().security;
		const refreshName = security.jwtCookieRefreshName || 'RT';
		let currentToken: string | null = null;

		if (req.cookies?.[refreshName]) {
			currentToken = req.cookies[refreshName];
		} else {
			const authHeader = this.getHeaders().authorization;
			if (authHeader?.startsWith('Bearer ')) currentToken = authHeader.split(' ')[1];
		}

		const { user, accessToken, refreshToken } = await AuthService.refreshUserSession(currentToken);
		const transport = this._getExpectedTransport();

		if (transport === 'cookie') {
			const accessName = security.jwtCookieAccessName || 'AT';
			this.setCookie(accessName, accessToken, { maxAge: JWTUtil.getAccessExpiresInMs() });
			this.setCookie(refreshName, refreshToken, {
				path: `${req.baseUrl}`,
				maxAge: JWTUtil.getRefreshExpiresInMs(),
			});
			return this.success({ user }, 'Sesión renovada');
		}

		return this.success({ user, tokens: { accessToken, refreshToken } }, 'Sesión renovada');
	}

	async logout() {
		const req = this.getRequest();
		const security = AppConfig.load().security;
		const refreshName = security.jwtCookieRefreshName || 'RT';
		const accessName = security.jwtCookieAccessName || 'AT';

		const accessToken = (req as any).token ?? null;
		let refreshToken: string | null = null;

		if (req.cookies?.[refreshName]) {
			refreshToken = req.cookies[refreshName];
		} else {
			const authHeader = this.getHeaders().authorization;
			if (authHeader?.startsWith('Bearer ')) refreshToken = authHeader.split(' ')[1];
		}

		await AuthService.logoutUser(accessToken, refreshToken);

		if (this._getExpectedTransport() === 'cookie') {
			this.clearCookie(accessName);
			this.clearCookie(refreshName, { path: `${req.baseUrl}` });
		}

		return this.success(null, 'Sesión finalizada exitosamente');
	}

	// --- Password Reset ---

	private _parseAccountType(accountType: string): number {
		if (accountType === 'admin' || accountType === 'employee') return 1;
		if (accountType === 'customer' || accountType === 'client') return 2;
		return Number(accountType);
	}

	async forgotPassword() {
		const { accountType } = this.getRequest().params || {};
		if (!accountType) throw new Error('El tipo de cuenta es requerido');

		const result = await AuthService.forgotPassword(this._parseAccountType(accountType as string), this.getBody());

		return this.success(null, result.message);
	}

	async verifyResetCode() {
		const { accountType } = this.getRequest().params || {};
		if (!accountType) throw new Error('El tipo de cuenta es requerido');

		const result = await AuthService.verifyResetCode(this._parseAccountType(accountType as string), this.getBody());

		return this.success(result, 'Código verificado correctamente');
	}

	async resetPassword() {
		const { accountType } = this.getRequest().params || {};
		if (!accountType) throw new Error('El tipo de cuenta es requerido');

		const result = await AuthService.resetPassword(this._parseAccountType(accountType as string), this.getBody());

		return this.success(null, result.message);
	}
}

export default new AuthController();
