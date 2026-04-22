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
import JWTUtil, { RefreshTokenPayload } from '@utils/jwt.util.js';
import jwt from 'jsonwebtoken';

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
	private get _roles() {
		return Database.repository('main', 'roles') as any;
	}
	private get _permisos() {
		return Database.repository('main', 'permissions') as any;
	}
	private get _usersLogins() {
		return Database.repository('main', 'users-logins') as any;
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
			email: foundUser.email,
			documentNumber: foundUser.document_number,
			firstName: foundUser._People.first_name,
			lastName: foundUser._People.last_name,
			personalEmail: foundUser._People?.personal_email,
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

	private async _buildLoginResponse(sessionData: any): Promise<LoginResponse> {
		const payload = await this._buildUserPayload(sessionData);
		const accessToken = JWTUtil.generateToken(payload);
		const refreshToken = JWTUtil.generateRefreshToken({ userId: sessionData.id });

		return { user: payload, accessToken, refreshToken };
	}

	async registerUser(signupBody: CustomerSignupBody) {
		const { firstName, lastName, email, phoneNumber, documentNumber, gender, birthDate, password } = signupBody;
		const person = { firstName, lastName, email, phoneNumber, documentNumber, gender, birthDate };
		const user = { email, password };

		if (!password || !documentNumber || !firstName || !lastName || !email || !phoneNumber || !gender || !birthDate)
			throw new ValidationError('Los datos de registro están incompletos', []);

		const validations = [
			{ value: email, regex: REGEX.EMAIL, message: 'El correo electrónico no es válido' },
			{
				value: password,
				regex: REGEX.PASSWORD,
				message:
					'La contraseña debe tener entre 8 y 20 caracteres y contener al menos un símbolo especial, una letra y un número',
			},
			{ value: documentNumber, regex: REGEX.DOCUMENT_NUMBER, message: 'El número de documento no es válido' },
			{ value: firstName, regex: REGEX.PERSON_NAME, message: 'El nombre no es válido' },
			{ value: lastName, regex: REGEX.PERSON_NAME, message: 'El apellido no es válido' },
			{ value: phoneNumber, regex: REGEX.PHONE_NUMBER, message: 'El número de teléfono no es válido' },
			{ value: gender, regex: REGEX.DATABASE_ID, message: 'El género no es válido' },
			{ value: birthDate, regex: REGEX.DATE, message: 'La fecha de nacimiento no es válida' },
		];
		const validated = { good: [] as string[], bad: [] as string[] };

		for (const validation of validations)
			validated[!validation.regex.test(String(validation.value)) ? 'bad' : 'good'].push(validation.message);
		if (validated.bad.length > 0) throw new ValidationError(validated.bad.join('; '), []);

		const foundUser = await this._users.getByEmail(email);
		if (foundUser) throw new AuthError('El usuario ya existe', { code: 'USER_ALREADY_EXISTS' });

		const created = await this._people.transaction(async (transaction: Transaction) => {
			const createdPerson = await this._people.create(
				Object.fromEntries(
					Object.entries(person).map(([key, value]) => [
						convertCase(key == 'email' ? 'personal_email' : key, 'pascal', 'snake'),
						key == 'gender' ? Number(value) : value,
					]),
				),
				{ transaction },
			);
			const createdUser = await this._users.create(
				{
					...user,
					user_type: 2, // Por defecto usuario de tipo "cliente"
					password: await BcryptUtil.hash(user.password),
					person: createdPerson.id,
				},
				{ transaction },
			);

			return createdUser;
		});

		const newUser = await this.findUserById(created.id);

		return this._buildLoginResponse(newUser);
	}

	async authenticateUser({ email, password }: LoginBody, device?: string): Promise<LoginResponse> {
		if (!email || !password) throw new ValidationError('Las credenciales están incompletas', []);

		if (!REGEX.EMAIL.test(email) || !REGEX.PASSWORD.test(password))
			throw new ValidationError('Las credenciales no son válidas', []);

		const foundUser = await this._users.getByEmail(email);
		if (!foundUser || !(await BcryptUtil.compare(password, foundUser.password)))
			throw new AuthError('Las credenciales no son correctas', { code: 'INVALID_LOGIN' });

		const loginResponse = await this._buildLoginResponse(foundUser);
		const decodedToken = jwt.decode(loginResponse.refreshToken) as { jti?: string; exp?: number };

		if (decodedToken && decodedToken.jti && decodedToken.exp) {
			await this._usersLogins.create({
				user: foundUser.id,
				device: device || 'Unknown Device',
				jti: decodedToken.jti,
				expires_at: new Date(decodedToken.exp * 1000),
				token_status: 1,
				status: 1,
			});
		}

		return loginResponse;
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
		if (!loginRecord || loginRecord.token_status === 2 || loginRecord.status === 2)
			throw new AuthError('Sesión invalidada.', { code: 'REVOKED_SESSION' });

		const foundUser = await this.findUserById(savedSession.userId);
		if (!foundUser || foundUser.status !== 1)
			throw new AuthError('El usuario no existe o está inactivo.', { code: 'USER_INACTIVE' });

		const loginResponse = await this._buildLoginResponse(foundUser);
		const decodedNew = jwt.decode(loginResponse.refreshToken) as { jti?: string; exp?: number };

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

	/**
	 * Destrucción explícita de credenciales
	 */
	async logoutUser(accessToken: string | null, refreshToken: string | null): Promise<void> {
		if (!accessToken && !refreshToken) throw new AuthError('No existen tokens vigentes a invalidar');

		const blacklistPromises = [];

		let decodedRefresh: any;
		if (refreshToken) {
			decodedRefresh = jwt.decode(refreshToken);
			blacklistPromises.push(tokenBlacklistService.blacklistToken(refreshToken));
		}

		if (accessToken) blacklistPromises.push(tokenBlacklistService.blacklistToken(accessToken));

		await Promise.all(blacklistPromises);

		if (decodedRefresh?.jti) await this._usersLogins.update({ jti: decodedRefresh.jti }, { token_status: 2 });
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
