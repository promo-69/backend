import { ControllerBase } from '@bases/controller.base.js';
import { AppConfig } from '@config/app.config.js';
import JWTUtil from '@utils/jwt.util.js';
import AuthService from './_.service.js';

class AuthController extends ControllerBase {
    constructor() {
        super();
    }

    // --- Authentication ---

    async login() {
        const body = this.getBody();
        const { user, accessToken, refreshToken } = await AuthService.authenticateUser(body);

        const security = AppConfig.load().security;

        if (security.sessionTransmissionMethod === 'cookie') {
            const accessName = security.jwtCookieAccessName || 'AT';
            const refreshName = security.jwtCookieRefreshName || 'RT';

            this.setCookie(accessName, accessToken, { maxAge: JWTUtil.getAccessExpiresInMs() });
            this.setCookie(refreshName, refreshToken, { maxAge: JWTUtil.getRefreshExpiresInMs() });
            return this.success({ user }, 'Autenticación exitosa');
        }

        // Bearer strategy
        return this.success({ user, accessToken, refreshToken }, 'Autenticación exitosa');
    }

    async refresh() {
        let currentToken: string | null = null;
        const security = AppConfig.load().security;

        if (security.sessionTransmissionMethod === 'cookie') {
            const refreshName = security.jwtCookieRefreshName;
            currentToken = this.getRequest().cookies?.[refreshName] || null;
        } else {
            const authHeader = this.getHeaders().authorization;
            if (authHeader?.startsWith('Bearer ')) currentToken = authHeader.split(' ')[1];
        }

        const { accessToken, refreshToken, user } = await AuthService.refreshUserSession(currentToken);

        if (security.sessionTransmissionMethod === 'cookie') {
            const accessName = security.jwtCookieAccessName;
            const refreshName = security.jwtCookieRefreshName;

            this.setCookie(accessName, accessToken, { maxAge: JWTUtil.getAccessExpiresInMs() });
            if (refreshToken) this.setCookie(refreshName, refreshToken, { maxAge: JWTUtil.getRefreshExpiresInMs() });
            return this.success({ user }, 'Sesión renovada');
        }

        return this.success({ user, accessToken, refreshToken }, 'Sesión renovada');
    }

    async logout() {
        const security = AppConfig.load().security;

        if (security.sessionTransmissionMethod === 'cookie') {
            const accessName = security.jwtCookieAccessName;
            const refreshName = security.jwtCookieRefreshName;

            this.clearCookie(accessName);
            this.clearCookie(refreshName);
        }
        return this.success(null, 'Sesión finalizada exitosamente');
    }

    // --- Users ---

    async findAllUsers() {
        const data = await AuthService.findAllUsers(this.getQueryFilters());
        return data;
    }

    async findUserById() {
        const { id } = this.getParams();
        const data = await AuthService.findUserById(Number(id));

        return data;
    }

    async createUser() {
        const { roles, ...body } = this.getBody();
        const data = await AuthService.createUser(body, roles);
        return this.created(data);
    }

    async register() {
        const body = this.getBody();
        const data = await AuthService.registerUser(body);
        return this.created(data);
    }

    // --- Roles ---

    async findAllRoles() {
        const data = await AuthService.findAllRoles(this.getQueryFilters());
        return data;
    }

    async findRoleById() {
        const { id } = this.getParams();
        const data = await AuthService.findRoleById(Number(id));
        return data;
    }

    // --- Permissions ---

    async findAllPermissions() {
        const data = await AuthService.findAllPermissions(this.getQueryFilters());
        return data;
    }

    async findPermissionById() {
        const { id } = this.getParams();
        const data = await AuthService.findPermissionById(Number(id));
        return data;
    }
}

export default new AuthController();
