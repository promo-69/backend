import { ControllerBase } from '@bases/controller.base.js';
import { AppConfig } from '@config/app.config.js';
import JWTUtil from '@utils/jwt.util.js';
import AuthService from './_.service.js';

class AuthController extends ControllerBase {
    constructor() {
        super();
    }

    /**
     * Determina el canal de respuesta adecuado (Cookie o Bearer JSON)
     * basado en cabeceras explícitas o inferencia de la petición.
     */
    private _getExpectedTransport(): 'cookie' | 'bearer' {
        const req = this.getRequest();

        // 1. Identificación explícita del cliente (Mejor práctica)
        // El frontend web debe enviar { 'x-client-channel': 'web' }
        // La app móvil debe enviar { 'x-client-channel': 'mobile' }
        const clientChannel = req.headers['x-client-channel'];
        if (clientChannel === 'web') return 'cookie';
        if (clientChannel === 'mobile') return 'bearer';

        // 2. Inferencia de canal (Útil para refresh/logout si omiten la cabecera)
        const security = AppConfig.load().security;
        const refreshName = security.jwtCookieRefreshName || 'RT';

        // Si la petición trae nuestra cookie, asumimos que es un cliente Web
        if (req.cookies && req.cookies[refreshName]) return 'cookie';

        // 3. Fallback por defecto (Comportamiento API estándar)
        return 'bearer';
    }

    // --- Auth & Session ---

    async signup() {
        const data = await AuthService.registerUser(this.getBody());
        return this.created(data);
    }

    async login() {
        const body = this.getBody();

        const {
            user,
            accessToken,
            refreshToken,
        }: {
            user: Record<string, any>;
            accessToken: string;
            refreshToken: string;
        } = await AuthService.authenticateUser(body);

        const transport = this._getExpectedTransport();

        if (transport === 'cookie') {
            const security = AppConfig.load().security;
            const accessName = security.jwtCookieAccessName || 'AT';
            const refreshName = security.jwtCookieRefreshName || 'RT';

            this.setCookie(accessName, accessToken, { maxAge: JWTUtil.getAccessExpiresInMs() });
            this.setCookie(refreshName, refreshToken, {
                path: '/api/v1/auth/refresh',
                maxAge: JWTUtil.getRefreshExpiresInMs(),
            });

            // Retorna SOLO el usuario. Protege al frontend de malas prácticas.
            return this.success({ user }, 'Autenticación exitosa');
        }

        // Canal Móvil (Bearer): Retorna los tokens en el payload. No setea cookies.
        return this.success({ user, accessToken, refreshToken }, 'Autenticación exitosa');
    }

    async refresh() {
        const req = this.getRequest();
        const security = AppConfig.load().security;
        const refreshName = security.jwtCookieRefreshName || 'RT';
        let currentToken: string | null = null;

        // Extraer token priorizando la cookie, luego el header
        if (req.cookies && req.cookies[refreshName]) {
            currentToken = req.cookies[refreshName];
        } else {
            const authHeader = this.getHeaders().authorization;
            if (authHeader?.startsWith('Bearer ')) currentToken = authHeader.split(' ')[1];
        }

        const { accessToken, refreshToken, user } = await AuthService.refreshUserSession(currentToken);

        const transport = this._getExpectedTransport();

        if (transport === 'cookie') {
            const accessName = security.jwtCookieAccessName || 'AT';
            this.setCookie(accessName, accessToken, { maxAge: JWTUtil.getAccessExpiresInMs() });
            if (refreshToken) this.setCookie(refreshName, refreshToken, { maxAge: JWTUtil.getRefreshExpiresInMs() });

            // Retorna SOLO el usuario
            return this.success({ user }, 'Sesión renovada');
        }

        // Canal Móvil
        return this.success({ user, accessToken, refreshToken }, 'Sesión renovada');
    }

    async logout() {
        const req = this.getRequest();
        const security = AppConfig.load().security;
        const refreshName = security.jwtCookieRefreshName || 'RT';
        const accessName = security.jwtCookieAccessName || 'AT';

        const accessToken = req.token || null; // Extraído por el middleware
        let refreshToken: string | null = null;

        // Extraer refresh token a invalidar
        if (req.cookies && req.cookies[refreshName]) {
            refreshToken = req.cookies[refreshName];
        } else {
            const authHeader = this.getHeaders().authorization;
            if (authHeader?.startsWith('Bearer ')) refreshToken = authHeader.split(' ')[1];
        }

        // Ejecutar invalidación en Redis
        await AuthService.logoutUser(accessToken, refreshToken);

        const transport = this._getExpectedTransport();

        if (transport === 'cookie') {
            // Limpiar cookies explícitamente en el navegador
            this.clearCookie(accessName);
            this.clearCookie(refreshName);
        }

        return this.success(null, 'Sesión finalizada exitosamente');
    }

    async me() {
        const session = this.getSession();
        return this.success(session, 'Usuario obtenido exitosamente');
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
        const userData = this.getBody();
        const data = await AuthService.createUser(userData);

        return data;
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
