import { BaseService } from '@bases/service.base.js';
import { Database } from '@database/index.js';
import { AuthError, ValidationError } from '@errors';
import { Transaction } from 'sequelize';
import { ExceptionPermissions } from '@rules/permission-exceptions.type.js';
import { BcryptUtil } from '@utils/bcrypt.util.js';
import { UserSession } from '@rules/api.type.js';
import { REGEX } from '@constants/regex.constant.js';
import { convertCase } from '@utils/string-formatters.util.js';
import { tokenBlacklistService } from '@services/token-blacklist.service.js';
import { emailService } from '@services/email.service.js';
import { CacheDatabaseProvider } from '@providers/cache-database.provider.js';
import JWTUtil, { RefreshTokenPayload } from '@utils/jwt.util.js';
import { customAlphabet, nanoid } from 'nanoid';
import { Logger } from '@utils/logger.util.js';

const generateCode = customAlphabet('1234567890', 4);
const generateToken = customAlphabet('1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ', 64);

interface LoginBody {
    email: string;
    password: string;
}

interface LoginResponse {
    user: UserSession;
    accessToken: string;
    refreshToken: string;
}

interface CustomerSignupBody extends LoginBody {
    documentNumber: string;
    firstName: string;
    lastName: string;
    gender: string | number;
    birthDate: string;
    phoneNumber: string;
}

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
    private get _permisos() {
        return Database.repository('main', 'permissions') as any;
    }
    private get _usersLogins() {
        return Database.repository('main', 'users-logins') as any;
    }
    private get _cacheClient() {
        return CacheDatabaseProvider.getInstance().client;
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

    private get _roles() {
        return Database.repository('main', 'roles') as any;
    }

    // --- Authentication & Sessions ---

    private async _buildUserPayload(foundUser: any): Promise<UserSession> {
        const payload: UserSession = {
            userId: foundUser.id,
            email: foundUser.email,
            documentNumber: foundUser.document_number,
            firstName: foundUser._People?.first_name ?? null,
            lastName: foundUser._People?.last_name ?? null,
            personalEmail: foundUser._People?.personal_email ?? null,
            phoneNumber: foundUser._People?.phone_number ?? null,
        };

        // Solo se ejecuta si es empleado y las relaciones necesarias están disponibles
        if (foundUser.user_type == 1 && foundUser._Roles && foundUser._UserPermissions) {
            const permissionsExceptions: ExceptionPermissions = foundUser._UserPermissions.reduce(
                (acu: ExceptionPermissions, cur: any) => {
                    acu[cur.is_granted ? 'granted' : 'revoked'].push(cur.permission);
                    return acu;
                },
                { granted: [], revoked: [] },
            );

            const roles = [
                foundUser.role,
                ...(foundUser._Roles._RoleInheritancesChild?.map((r: any) => r.parent_role) ?? []),
            ];
            const { rows: permissions } = await this._permisos.getByRolesWithExceptions({
                roles,
                exceptions: permissionsExceptions,
            });

            payload.roleDesc = foundUser._Roles?.description;
            payload.roleCode = foundUser._Roles?.code;
            payload.permissions = this.parsePermissions(permissions);
        }

        return payload;
    }

    private async _buildLoginResponse(sessionData: any): Promise<LoginResponse> {
        const activePosition = sessionData._People?._Employees?.[0]?._EmployeePositions?.find(
            (p: any) => p.end_date === null,
        );
        const cinema = activePosition?.cinema;

        const payload = await this._buildUserPayload(sessionData);

        // Cargar el roleCode desde la base de datos
        if (sessionData.role) {
            const role = await this._roles.getById(sessionData.role);
            if (role) {
                payload.roleCode = role.code;

                // Asignar permisos comodín al SUPER_ADMIN
                if (role.code === 'SUPER_ADMIN') {
                    payload.permissions = ['*:*'];
                }
            }
        }

        if (cinema) payload.cinemaId = cinema;

        const accessToken = JWTUtil.generateToken(payload);
        const refreshToken = JWTUtil.generateRefreshToken({ userId: sessionData.id });

        return { user: payload, accessToken, refreshToken };
    }

    async registerUser(signupBody: CustomerSignupBody): Promise<void> {
        const { firstName, lastName, email, phoneNumber, documentNumber, gender, birthDate, password } = signupBody;
        const person = { firstName, lastName, email, phoneNumber, documentNumber, gender, birthDate };
        const user = { email, password };

        if (!documentNumber || !email || !password)
            throw new ValidationError('Los datos de registro están incompletos', []);

        this.validateRegexpFields([
            { value: documentNumber, regex: REGEX.DOCUMENT_NUMBER, message: 'El número de documento no es válido' },
            { value: email, regex: REGEX.EMAIL, message: 'El correo electrónico no es válido' },
            {
                value: password,
                regex: REGEX.PASSWORD,
                message:
                    'La contraseña debe tener entre 8 y 20 caracteres y contener al menos un símbolo especial, una letra y un número',
            },
        ]);

        const existingUserByEmail = await this._users.getByEmail(email);
        if (existingUserByEmail) throw new AuthError('El usuario ya existe', { code: 'USER_ALREADY_EXISTS' });

        let existingPerson = await this._people.getByDocumentNumber(documentNumber);

        if (!existingPerson) {
            if (!firstName || !lastName || !phoneNumber || !gender || !birthDate)
                throw new ValidationError('Los datos personales están incompletos para un nuevo registro', []);

            this.validateRegexpFields([
                { value: firstName, regex: REGEX.PERSON_NAME, message: 'El nombre no es válido' },
                { value: lastName, regex: REGEX.PERSON_NAME, message: 'El apellido no es válido' },
                { value: phoneNumber, regex: REGEX.PHONE_NUMBER, message: 'El número de teléfono no es válido' },
                { value: gender, regex: REGEX.DATABASE_ID, message: 'El género no es válido' },
                { value: birthDate, regex: REGEX.DATE, message: 'La fecha de nacimiento no es válida' },
            ]);
        }

        let created;
        try {
            created = await this._users.transaction(async (transaction: Transaction) => {
                const signupCode = nanoid(20);

                let createdPerson;
                if (!existingPerson) {
                    createdPerson = await this._people.create(
                        Object.fromEntries(
                            Object.entries(person).map(([key, value]) => [
                                convertCase(key == 'email' ? 'personal_email' : key, 'pascal', 'snake'),
                                key == 'gender' ? Number(value) : value,
                            ]),
                        ),
                        { transaction },
                    );
                }

                const createdUser = await this._users.create(
                    {
                        ...user,
                        user_type: 2,
                        password: await BcryptUtil.hash(user.password),
                        person: createdPerson.id,
                        signup_code: await BcryptUtil.hash(signupCode),
                    },
                    { transaction },
                );

                return { createdUser, signupCode };
            });
        } catch (error: any) {
            throw new AuthError('No se pudo completar el registro del usuario', error?.());
        }

        emailService.sendVerificationCode(email, email, created.signupCode).catch((err) => {
            Logger.error('Error al enviar el correo de verificación:', err);
        });
    }

    async authenticateUser({ email, password }: LoginBody, device?: string): Promise<LoginResponse> {
        if (!email || !password) throw new ValidationError('Las credenciales están incompletas', []);

        if (!REGEX.EMAIL.test(email) || !REGEX.PASSWORD.test(password))
            throw new ValidationError('Las credenciales no son válidas', []);

        // Usamos getOne con include manual para esquivar el error de users.repository.ts
        const foundUser = await this._users.getOne(
            { email },
            {
                include: [
                    { association: '_People' },
                    { association: '_UserTypes' },
                    // No incluimos _Roles ni _UserPermissions por ahora
                ],
            },
        );

        if (!foundUser || !(await BcryptUtil.compare(password, foundUser.password)))
            throw new AuthError('Las credenciales no son correctas', { code: 'INVALID_LOGIN' });

        if (!foundUser.signup_verified_at) {
            const signupCode = nanoid(20);
            await this._users.update(
                { id: foundUser.id },
                {
                    signup_code: await BcryptUtil.hash(signupCode),
                },
            );

            emailService.sendVerificationCode(email, email, signupCode).catch((err) => {
                Logger.error('Error al enviar el correo de verificación:', err);
            });

            throw new AuthError(
                'Cuenta no verificada. Por favor revisa tu correo electrónico y completa la verificación.',
                { code: 'UNVERIFIED_ACCOUNT' },
            );
        }

        const loginResponse = await this._buildLoginResponse(foundUser);
        const decodedToken = JWTUtil.decodeToken(loginResponse.refreshToken) as { jti?: string; exp?: number };

        if (decodedToken && decodedToken.jti && decodedToken.exp) {
            await this._usersLogins.create({
                user: foundUser.id,
                device: device || 'Unknown Device',
                jti: decodedToken.jti,
                expires_at: new Date(decodedToken.exp * 1000),
                token_status: 1,
            });
        }

        return loginResponse;
    }

    async verifySignupCode(email: string, code: string | number, device?: string): Promise<void> {
        if (!email || !code) throw new ValidationError('El email y código son requeridos', []);

        const foundUser = await this._users.getByEmail(email);
        if (!foundUser) throw new AuthError('Usuario no encontrado', { code: 'USER_NOT_FOUND' });

        if (foundUser.signup_verified_at)
            throw new AuthError('La cuenta ya se encuentra verificada', { code: 'ACCOUNT_ALREADY_VERIFIED' });

        if (!(await BcryptUtil.compare(code as string, foundUser.signup_code)))
            throw new AuthError('El código de verificación es inválido', { code: 'INVALID_VERIFICATION_CODE' });

        await this._users.update(
            { id: foundUser.id },
            {
                signup_code: null,
                signup_verified_at: new Date(),
            },
        );

        emailService.sendWelcomeEmail(foundUser.email, foundUser._People.first_name).catch((err) => {
            Logger.error('Error al enviar correo de bienvenida:', err);
        });
    }

    async refreshUserSession(currentToken: string | null, device?: string) {
        if (!currentToken) throw new AuthError('No es posible reiniciar la sesión.');

        let savedSession: RefreshTokenPayload & { jti?: string; exp?: number };

        try {
            savedSession = JWTUtil.verifyRefreshToken<RefreshTokenPayload & { jti?: string; exp?: number }>(
                currentToken,
            );
        } catch (error: any) {
            throw new AuthError(error.message, { code: 'INVALID_TOKEN' });
        }

        if (!savedSession.userId || !savedSession.jti)
            throw new AuthError('Falta identificación en el token.', { code: 'INVALID_TOKEN' });
        const isLockAcquired = await tokenBlacklistService.blacklistTokenAtRefresh(currentToken);

        if (!isLockAcquired) throw new AuthError('Sesión invalidada.', { code: 'INVALID_SESSION' });
        const loginRecord = await this._usersLogins.getOne({ jti: savedSession.jti });

        if (!loginRecord || loginRecord.token_status === 2)
            throw new AuthError('Sesión invalidada.', { code: 'REVOKED_SESSION' });

        const foundUser = await this._users.getFull(savedSession.userId);
        if (!foundUser) throw new AuthError('El usuario no existe o está inactivo.', { code: 'USER_INACTIVE' });

        const loginResponse = await this._buildLoginResponse(foundUser);
        const decodedNew = JWTUtil.decodeToken(loginResponse.refreshToken) as { jti?: string; exp?: number };

        if (decodedNew && decodedNew.jti && decodedNew.exp) {
            await this._usersLogins.update(
                { jti: savedSession.jti, user: foundUser.id },
                {
                    jti: decodedNew.jti,
                    expires_at: new Date(decodedNew.exp * 1000),
                    device: device || loginRecord.device || 'Unknown Device',
                    updated_at: new Date(),
                },
            );
        }

        return loginResponse;
    }

    async logoutUser(accessToken: string | null, refreshToken: string | null): Promise<void> {
        if (!accessToken && !refreshToken) throw new AuthError('No existen tokens vigentes a invalidar');

        const blacklistPromises = [];

        let decodedRefresh: any;
        if (refreshToken) {
            decodedRefresh = JWTUtil.decodeToken(refreshToken);
            blacklistPromises.push(tokenBlacklistService.blacklistToken(refreshToken));
        }

        if (accessToken) blacklistPromises.push(tokenBlacklistService.blacklistToken(accessToken));

        await Promise.all(blacklistPromises);

        if (decodedRefresh?.jti) await this._usersLogins.update({ jti: decodedRefresh.jti }, { token_status: 2 });
    }

    async forgotPassword(email: string): Promise<{ message: string }> {
        if (!email) throw new ValidationError('El correo electrónico es requerido', []);

        const foundUser = await this._users.getByEmail(email);

        if (foundUser) {
            const resetCode = generateCode();
            const ttlSeconds = 10 * 60;

            const key = `auth:reset:code:${email}`;
            await this._cacheClient.set(key, resetCode, 'EX', ttlSeconds);

            emailService.sendPasswordResetEmail(email, resetCode).catch((err) => {
                Logger.error('Error al enviar correo de restablecimiento de contraseña:', err);
            });
        }

        return { message: 'Si el correo está registrado, recibirás un código para restablecer tu contraseña.' };
    }

    async verifyResetCode(email: string, code: string): Promise<{ resetToken: string }> {
        if (!email || !code) throw new ValidationError('El correo y el código son requeridos', []);

        const foundUser = await this._users.getByEmail(email);
        if (!foundUser) throw new AuthError('El código o correo son inválidos', { code: 'INVALID_RESET_CODE' });

        const keyCode = `auth:reset:code:${email}`;
        const savedCode = await this._cacheClient.get(keyCode);

        if (!savedCode || savedCode !== code)
            throw new AuthError('El código de verificación no es válido o ha expirado', { code: 'INVALID_RESET_CODE' });

        await this._cacheClient.del(keyCode);

        const resetToken = generateToken();
        const ttlSeconds = 10 * 60;

        const keyToken = `auth:reset:token:${email}`;
        await this._cacheClient.set(keyToken, resetToken, 'EX', ttlSeconds);

        return { resetToken };
    }

    async resetPassword(email: string, resetToken: string, newPassword: string): Promise<{ message: string }> {
        if (!email || !resetToken || !newPassword) throw new ValidationError('Todos los campos son requeridos', []);

        if (!REGEX.PASSWORD.test(newPassword))
            throw new ValidationError(
                'La contraseña debe tener entre 8 y 20 caracteres y contener al menos un símbolo especial, una letra y un número',
                [],
            );

        const foundUser = await this._users.getByEmail(email);
        if (!foundUser) throw new AuthError('El token o correo son inválidos', { code: 'INVALID_RESET_TOKEN' });

        const keyToken = `auth:reset:token:${email}`;
        const savedToken = await this._cacheClient.get(keyToken);

        if (!savedToken || savedToken !== resetToken)
            throw new AuthError('El token de restablecimiento no es válido o ha expirado', {
                code: 'INVALID_RESET_TOKEN',
            });

        const hashedPassword = await BcryptUtil.hash(newPassword);

        await this._users.update({ id: foundUser.id }, { password: hashedPassword });

        await this._cacheClient.del(keyToken);

        await this._usersLogins.update({ user: foundUser.id }, { token_status: 2 });

        return { message: 'Tu contraseña ha sido restablecida exitosamente. Ahora puedes iniciar sesión.' };
    }
}

export default new AuthService();
