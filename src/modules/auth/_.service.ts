import { BaseService } from '@bases/service.base.js';
import { Database } from '@database/index.js';
import JWTUtil from '@utils/jwt.util.js';
import { AuthError, ValidationError } from '@errors';
import { Transaction } from 'sequelize';
import { ExceptionPermissions } from '@rules/permission-exceptions.type.js';
import { BcryptUtil } from '@utils/bcrypt.util.js';
import { UserSession } from '@rules/api.type.js';
import { REGEX } from '@constants/regex.constant.js';
import { convertCase } from '@utils/string-formatters.util.js';

export class AuthService extends BaseService {
    constructor() {
        super();
    }

    private get _users() {
        return Database.repository('main', 'users') as any;
    }
    private get _people() {
        return Database.repository('main', 'people') as any;
    }
    private get _roles() {
        return {} as any;
        //return Database.repository('main', 'roles') as any;
    }
    private get _permisos() {
        return Database.repository('main', 'permissions') as any;
    }

    private parsePermissions(permissions: any[]): string[] {
        return Array.from(
            new Set(
                permissions.map((per) => {
                    const resource = per._Resources?.code;
                    const action = per._Actions?.code;
                    const type = per._PermissionTypes?.code;
                    return `${type}:${action}:${resource}`;
                }),
            ),
        );
    }

    // --- Authentication & Sessions ---

    private async _buildUserPayload(foundUser: any): Promise<UserSession> {
        const payload: UserSession = {
            userId: foundUser.id,
            documentNumber: foundUser.document_number,
            firstName: foundUser._People.first_name,
            lastName: foundUser._People.last_name,
            email: foundUser._People?.email,
            phoneNumber: foundUser._People?.phone_number,
        };

        // Encontrar permisos del rol cuando el usuario es de tipo "empleado"
        if (foundUser.user_type == 1) {
            const permissionsExceptions: ExceptionPermissions = foundUser._UserPermissions.reduce(
                (acu: ExceptionPermissions, cur: any) => {
                    acu[cur.is_granted ? 'granted' : 'revoked'].push(cur.permission);

                    return acu;
                },
                { granted: [], revoked: [] },
            );
            const { rows: permissions } = await this._permisos.getByRolesWithExceptions({
                roles: [foundUser.role, ...foundUser._Roles._RoleInheritancesChild.map((r: any) => r.parent_role)],
                exceptions: permissionsExceptions,
            });

            payload.roleDesc = foundUser._Roles?.description;
            payload.roleCode = foundUser._Roles?.code;
            payload.permissions = this.parsePermissions(permissions);
        }

        return payload;
    }

    private async _buildLoginResponse(sessionData: any) {
        const payload = await this._buildUserPayload(sessionData);
        const accessToken = JWTUtil.generateToken(payload);
        const refreshToken = JWTUtil.generateRefreshToken({ userId: sessionData.id });

        return { user: payload, accessToken, refreshToken };
    }

    async registerUser({
        person: _person,
        user: _user,
    }: {
        person: Record<string, string | null>;
        user: Record<string, string>;
    }) {
        const { firstName, lastName, email, phoneNumber, documentNumber, gender, birthDate } = _person;
        const { username, password } = _user;
        if (
            !username ||
            !password ||
            !documentNumber ||
            !firstName ||
            !lastName ||
            !email ||
            !phoneNumber ||
            !gender ||
            !birthDate
        )
            throw new ValidationError('Los datos de registro están incompletos', []);

        const validations = [
            { value: email, regex: REGEX.EMAIL, message: 'El correo electrónico no es válido' },
            {
                value: password,
                regex: REGEX.PASSWORD,
                message:
                    'La contraseña debe tener entre 8 y 20 caracteres y contener al menos un símbolo especial, una letra y un número',
            },
            { value: username, regex: REGEX.USERNAME, message: 'El nombre de usuario no es válido' },
            { value: documentNumber, regex: REGEX.DOCUMENT_NUMBER, message: 'El número de documento no es válido' },
            { value: firstName, regex: REGEX.PERSON_NAME, message: 'El nombre no es válido' },
            { value: lastName, regex: REGEX.PERSON_NAME, message: 'El apellido no es válido' },
            { value: phoneNumber, regex: REGEX.PHONE_NUMBER, message: 'El número de teléfono no es válido' },
            { value: gender, regex: REGEX.DATABASE_ID, message: 'El género no es válido' },
            { value: birthDate, regex: REGEX.DATE, message: 'La fecha de nacimiento no es válida' },
        ];
        const validated = { good: [] as string[], bad: [] as string[] };

        for (const validation of validations)
            validated[!validation.regex.test(validation.value) ? 'bad' : 'good'].push(validation.message);
        if (validated.bad.length > 0) throw new ValidationError(validated.bad.join('; '), []);

        const foundUser = await this._users.getByUsername(username);
        if (foundUser) throw new AuthError('El usuario ya existe', { code: 'USER_ALREADY_EXISTS' });

        Object.fromEntries(
            Object.entries({ ..._person, ..._user }).map(([key, value]) => [
                convertCase(key, 'pascal', 'snake'),
                value,
            ]),
        );
        const created = await this._people.transaction(async (transaction: Transaction) => {
            const createdPerson = await this._people.create(
                Object.fromEntries(
                    Object.entries(_person).map(([key, value]) => [convertCase(key, 'pascal', 'snake'), value]),
                ),
                { transaction },
            );
            const createdUser = await this._users.create(
                {
                    ...Object.fromEntries(
                        Object.entries(_user).map(([key, value]) => [convertCase(key, 'pascal', 'snake'), value]),
                    ),
                    user_type: 2, // Por defecto usuario de tipo "cliente"
                    password: await BcryptUtil.hash(_user.password),
                    person: createdPerson.id,
                },
                { transaction },
            );

            return createdUser;
        });

        const user = await this.findUserById(created.id);

        return this._buildLoginResponse(user);
    }

    async authenticateUser({
        username,
        password,
    }: Record<string, any>): Promise<{ user: Record<string, any>; accessToken: string; refreshToken: string }> {
        if (!username || !password) throw new ValidationError('Las credenciales están incompletas', []);

        if (!REGEX.USERNAME.test(username) || !REGEX.PASSWORD.test(password))
            throw new ValidationError('Las credenciales no son válidas', []);

        const foundUser = await this._users.getByUsername(username);
        if (!foundUser || !(await BcryptUtil.compare(password, foundUser.password)))
            throw new AuthError('Las credenciales no son correctas'+` ${foundUser}`, { code: 'INVALID_LOGIN' });

        return this._buildLoginResponse(foundUser);
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

        const foundUser = await this.findUserById(savedSession.userId);
        if (!foundUser || foundUser.status !== 1)
            throw new AuthError('El usuario no existe o está inactivo.', { code: 'USER_INACTIVE' });

        return this._buildLoginResponse(foundUser);
    }

    // --- Users ---

    async findAllUsers(filters?: any) {
        return this._users.getAllFull(filters);
    }

    async findUserById(id: number) {
        return this._users.getFull(id);
    }

    async createUser(userData: any) {
        return this._users.create(userData);
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
