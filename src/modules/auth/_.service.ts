import { BaseService } from '@bases/service.base.js';
import { Database } from '@database/index.js';
import JWTUtil from '@utils/jwt.util.js';
import { AuthError, ValidationError } from '@errors';

export class AuthService extends BaseService {
    constructor() {
        super();
    }

    private get _accesos() {
        return Database.repository('main', 'users') as any;
    }
    private get _rolesUsuarios() {
        return Database.repository('main', 'user-roles') as any;
    }
    private get _rolesPermisos() {
        return Database.repository('main', 'role-permissions') as any;
    }
    private get _roles() {
        return Database.repository('main', 'system-roles') as any;
    }
    private get _permisos() {
        return Database.repository('main', 'permissions') as any;
    }

    private get _personas() {
        return Database.repository('main', 'people') as any;
    }

    private parsePermissions(permissions: any[]): string[] {
        return Array.from(
            new Set(
                permissions.map((per) => {
                    const resource = per._Permissions?._Resources?.code;
                    const action = per._Permissions?._Actions?.code;
                    const type = per._Permissions?._PermissionTypes?.code;
                    return `${type}:${action}:${resource}`;
                }),
            ),
        );
    }

    // --- Authentication & Sessions ---

    private async _buildUserPayload(foundSession: any) {
        const rolesData: any[] = [];
        const permissionsData: string[] = [];

        const payload = {
            id: foundSession.id,
            document_number: foundSession.document_number,
            roles: rolesData,
            permissions: permissionsData,
            name: foundSession._People.first_name,
            surname: foundSession._People.last_name,
            email: foundSession._People.email,
            phone_number: foundSession._People.phone_number,
        };

        return payload;
    }

    async authenticateUser({ uid, password }: Record<string, any>) {
        if (!uid || !password) throw new ValidationError('Las credenciales están incompletas', []);

        const uidRegExp = /^[a-zA-Z0-9_\-\.]{4,20}$/;
        const passRegExp = /^.{6,50}$/;

        if (!uidRegExp.test(uid) || !passRegExp.test(password))
            throw new ValidationError('Las credenciales son inválidas', []);

        const foundSession = await this._accesos.getByCredentials({ username: uid, password: password });
        if (!foundSession) throw new AuthError('Las credenciales no son correctas', { code: 'INVALID_LOGIN' });

        const payload = await this._buildUserPayload(foundSession);
        const accessToken = JWTUtil.generateToken(payload);
        const refreshToken = JWTUtil.generateRefreshToken({ userId: foundSession.id });

        return { user: payload, accessToken, refreshToken };
    }

    async refreshUserSession(currentToken: string | null) {
        if (!currentToken) throw new AuthError('No es posible reiniciar la sesión.');

        let savedSession: any;
        try {
            savedSession = JWTUtil.verifyRefreshToken<any>(currentToken);
        } catch (error: any) {
            throw new AuthError(error.message, { code: 'INVALID_TOKEN' });
        }

        if (!savedSession.userId) throw new AuthError('Falta identificación en el token.', { code: 'INVALID_TOKEN' });

        const foundSession = await this.findUserById(savedSession.userId);
        if (!foundSession || foundSession.status !== 1)
            throw new AuthError('El usuario no existe o está inactivo.', { code: 'USER_INACTIVE' });

        const payload = await this._buildUserPayload(foundSession);
        const accessToken = JWTUtil.generateToken(payload);
        const refreshToken = JWTUtil.generateRefreshToken({ userId: foundSession.id });

        return { accessToken, refreshToken, user: payload };
    }

    // --- Users ---

    async findAllUsers(filters?: any) {
        return this._accesos.getAllFull(filters);
    }

    async findUserById(id: number) {
        return this._accesos.getFull(id);
    }

    async createUser(body: any, newRoles?: number[]) {
        const created = await this._accesos.create(body);
        if (newRoles?.length) {
            const mapRoles = newRoles.map((rol) => ({ userId: created.id, roleId: rol }));
            // Creating multiple roles manually to avoid complex TS partial array mapping errors gracefully
            for (const r of mapRoles) await this._rolesUsuarios.create(r);
        }
        return created;
    }

    async registerUser({ name, lastname, email, phone, username, password, document_number }: Record<string, any>) {
        if (!name || !lastname || !email || !username || !password || !document_number)
            throw new ValidationError('Los datos de registro están incompletos', []);

        const emailRegExp = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const passRegExp = /^.{6,50}$/;
        const uidRegExp = /^[a-zA-Z0-9_\-\.]{4,20}$/;

        if (!emailRegExp.test(email)) throw new ValidationError('El correo electrónico no es válido', []);
        if (!passRegExp.test(password))
            throw new ValidationError('La contraseña debe tener entre 6 y 50 caracteres', []);
        if (!uidRegExp.test(username)) throw new ValidationError('El nombre de usuario no es válido', []);

        const existingPerson = await this._personas.getOne({ email });
        if (existingPerson) throw new ValidationError('El correo electrónico ya está registrado', []);

        const existingUser = await this._accesos.getOne({ username });
        if (existingUser) throw new ValidationError('El nombre de usuario ya está en uso', []);

        const person = await this._personas.create({
            document_number,
            first_name: name,
            last_name: lastname,
            email,
            phone_number: phone || null,
            status: 1,
        });

        const user = await this._accesos.create({
            person: person.id,
            user_type: 2,
            username,
            password,
            status: 1,
        });

        return { id: user.id, username, email, name, lastname };
    }

    // --- Roles ---

    async findAllRoles(filters?: any) {
        return this._roles.getAllFull(filters);
    }

    async findRoleById(id: number) {
        return this._roles.getFull(id);
    }

    // --- Permissions ---

    async findAllPermissions(filters?: any) {
        return this._permisos.getAllFull(filters);
    }

    async findPermissionById(id: number) {
        return this._permisos.getFull(id);
    }
}

export default new AuthService();
