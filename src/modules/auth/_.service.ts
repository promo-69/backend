import { BaseService } from '@bases/service.base.js';
import { Database } from '@database/index.js';
import { Ops } from '@database/index.js';
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
import { QueueProvider } from '@providers/queue.provider.js';
import JWTUtil, { RefreshTokenPayload } from '@utils/jwt.util.js';
import { customAlphabet, nanoid } from 'nanoid';
import { Logger } from '@utils/logger.util.js';

// ─── Constantes de dominio ────────────────────────────────────────────────────

const USER_TYPE_EMPLOYEE = 1;
const USER_TYPE_CUSTOMER = 2;
const RESET_CODE_TTL_SECONDS = 5 * 60;
const RESET_TOKEN_TTL_SECONDS = 5 * 60;

// ─────────────────────────────────────────────────────────────────────────────

const generateCode = customAlphabet('1234567890', 4);
const generateAccessToken = customAlphabet('1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ', 64);

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
	private get _roles() {
		return Database.repository('main', 'roles') as any;
	}
	private get _rolePermissions() {
		return Database.repository('main', 'role-permissions') as any;
	}
	private get _customers() {
		return Database.repository('main', 'customers') as any;
	}
	private get _loyaltyLevels() {
		return Database.repository('main', 'loyalty-levels') as any;
	}
	private get _roleInheritances() {
		return Database.repository('main', 'role-inheritances') as any;
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

	private async getRolePermissions(roleId: number): Promise<string[]> {
		const roleInheritances = await this._roleInheritances.getAll({ count: false }, { child_role: roleId });
		const rolePermissions = await this._rolePermissions.getAll(
			{ count: false },
			{ role: [roleId, ...(roleInheritances.map((ri: any) => ri.parent_role) ?? [])] },
		);
		const permissionIds = (Array.isArray(rolePermissions) ? rolePermissions : rolePermissions.rows).map(
			(rp: any) => rp.permission,
		);

		if (permissionIds.length === 0) return [];

		const permissions = await this._permisos.getAllFull(
			{ count: false },
			{ id: permissionIds }
		);

		const permList = Array.isArray(permissions) ? permissions : permissions.rows;

		return permList
			.map((p: any) => {
				const action = p._Actions?.code;
				const resource = p._Resources?.code;
				const type = p._PermissionTypes?.code;
				return action && resource && type ? `${type}:${action}:${resource}` : null;
			})
			.filter((s: string | null) => s !== null) as string[];
	}

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

		if (foundUser.user_type === USER_TYPE_EMPLOYEE && foundUser._Roles && foundUser._UserPermissions) {
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

		if (foundUser.user_type === USER_TYPE_CUSTOMER) {
			const customer = await this._customers.getOne(
				{ person: foundUser.person },
				{
					attributes: ['id', 'loyalty_level', 'level_progress_points'],
				},
			);

			if (customer) {
				const level = await this._loyaltyLevels.getById(customer.loyalty_level, {
					attributes: ['id', 'name'],
				});

				// Incluir customerId en el JWT — orders.customer es customers.id, no users.id
				payload.customerId = customer.id;
				payload.loyaltyLevelId = customer.loyalty_level ?? 1;
				payload.loyaltyLevelName = level?.name ?? null;
				payload.loyaltyPoints = customer.level_progress_points ?? 0;
			}
		}

		return payload;
	}

	private async _buildLoginResponse(sessionData: any): Promise<LoginResponse> {
		const activePosition = sessionData._People?._Employees?.[0]?._EmployeePositions?.find(
			(p: any) => p.end_date === null,
		);
		const cinema = activePosition?.cinema;

		const payload = await this._buildUserPayload(sessionData);

		if (sessionData.role) {
			const role = await this._roles.getById(sessionData.role);
			if (role) {
				payload.roleCode = role.code;
				payload.permissions = await this.getRolePermissions(role.id);
			}
		}

		if (cinema) payload.cinemaId = cinema;

		const accessToken = JWTUtil.generateAccessToken(payload);
		const refreshToken = JWTUtil.generateRefreshToken({ userId: sessionData.id });

		return { user: payload, accessToken, refreshToken };
	}

	private async _authenticate(
		email: string,
		password: string,
		expectedUserType: number,
		device?: string,
	): Promise<LoginResponse> {
		if (!email || !password) throw new ValidationError('Las credenciales están incompletas', []);

		if (!REGEX.EMAIL.test(email) || !REGEX.PASSWORD.test(password))
			throw new ValidationError('Credenciales inválidas', []);

		const foundUser = await this._users.getOne(
			{ email, user_type: expectedUserType },
			{ relations: [{ association: '_People' }, { association: '_UserTypes' }] },
		);

		if (!foundUser || !(await BcryptUtil.compare(password, foundUser.password)))
			throw new AuthError('Credenciales inválidas', { code: 'INVALID_LOGIN' });

		const isEmployee = foundUser.role !== null && foundUser.role !== undefined;
		const expectedIsEmployee = expectedUserType === USER_TYPE_EMPLOYEE;

		if (isEmployee !== expectedIsEmployee) throw new AuthError('Credenciales inválidas', { code: 'INVALID_LOGIN' });

		const roleCode = foundUser.role ? (await this._roles.getById(foundUser.role))?.code : null;
		const isSuperAdmin = roleCode === 'SUPER_ADMIN';

		if (!isSuperAdmin && !expectedIsEmployee && !foundUser.signup_verified_at)
			throw new AuthError(
				'Cuenta no verificada. Por favor revisa tu correo electrónico y completa la verificación.',
				{ code: 'UNVERIFIED_ACCOUNT' },
			);

		const loginResponse = await this._buildLoginResponse(foundUser);
		const decodedToken = JWTUtil.decodeToken(loginResponse.refreshToken) as {
			jti?: string;
			exp?: number;
		};

		if (decodedToken?.jti && decodedToken?.exp) {
			await this._usersLogins.create({
				user: foundUser.id,
				device: device ?? 'Unknown Device',
				jti: decodedToken.jti,
				expires_at: new Date(decodedToken.exp * 1000),
				token_status: 1,
			});
		}

		return loginResponse;
	}

	// --- Métodos públicos de login (un método por canal, sin duplicación) ---

	/** POST /auth/login — exclusivo para clientes (user_type = 2, role IS NULL) */
	async authenticateCustomer(body: LoginBody, device?: string): Promise<LoginResponse> {
		return this._authenticate(body.email, body.password, USER_TYPE_CUSTOMER, device);
	}

	/** POST /auth/login/admin — exclusivo para empleados (user_type = 1, role IS NOT NULL) */
	async authenticateEmployee(body: LoginBody, device?: string): Promise<LoginResponse> {
		return this._authenticate(body.email, body.password, USER_TYPE_EMPLOYEE, device);
	}

	// --- Resto de métodos (sin cambios lógicos, solo números mágicos reemplazados) ---

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

		const existingUserByEmail = await this._users.getByClientEmail(email);
		if (existingUserByEmail) throw new AuthError('El usuario ya existe', { code: 'USER_ALREADY_EXISTS' });

		let existingPerson = await this._people.getByDocumentNumber(documentNumber);

		// Validación de persona existente por documento
		if (existingPerson) {
			// Si el documento ya pertenece a otra persona (nombres diferentes), rechazar
			if (existingPerson.first_name !== firstName || existingPerson.last_name !== lastName)
				throw new ValidationError('El número de documento ya está registrado.', ['documentNumber']);
			// Opcional: actualizar teléfono y fecha de nacimiento si han cambiado
			const updates: any = {};
			if (phoneNumber && existingPerson.phone_number !== phoneNumber) updates.phone_number = phoneNumber;
			if (birthDate && existingPerson.birth_date !== birthDate) updates.birth_date = birthDate;
			if (Object.keys(updates).length > 0) await this._people.update(existingPerson.id, updates);
		} else {
			// Validar datos obligatorios para crear una nueva persona
			if (!firstName || !lastName || !phoneNumber || !gender || !birthDate) {
				throw new ValidationError('Los datos personales están incompletos para un nuevo registro', []);
			}
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
				const signupCode = generateCode();

				let createdPerson;
				if (!existingPerson) {
					createdPerson = await this._people.create(
						Object.fromEntries(
							Object.entries(person).map(([key, value]) => [
								convertCase(key === 'email' ? 'personal_email' : key, 'pascal', 'snake'),
								key === 'gender' ? Number(value) : value,
							]),
						),
						{ transaction },
					);
				}

				const createdUser = await this._users.create(
					{
						...user,
						user_type: USER_TYPE_CUSTOMER,
						password: await BcryptUtil.hash(user.password),
						person: createdPerson?.id ?? existingPerson.id,
						signup_code: await BcryptUtil.hash(signupCode),
					},
					{ transaction },
				);

				return { createdUser, signupCode };
			});
		} catch (error: any) {
			throw new AuthError('No se pudo completar el registro del usuario', error?.());
		}

		emailService
			.sendVerificationCode(email, created.signupCode, `${firstName}${lastName ? ' ' + lastName : ''}`)
			.catch((err) => {
				Logger.error('Error al enviar el correo de verificación:', err);
			});

		QueueProvider.getInstance()
			.add(
				'signup-verification-queue',
				'expire-unverified-signup',
				{ email, userId: created.createdUser.id, personId: created.createdUser.person },
				{ delay: 600_000 },
			)
			.catch((err) => {
				Logger.error('Error al encolar trabajo signup-verification-queue:', err);
			});
	}

	async verifySignupCode(email: string, code: string | number, device?: string): Promise<void> {
		if (!email || !code) throw new ValidationError('El email y código son requeridos', []);

		const foundUser = await this._users.getByClientEmail(email);

		if (!foundUser) throw new AuthError('Usuario no encontrado', { code: 'USER_NOT_FOUND' });

		if (foundUser.signup_verified_at)
			throw new AuthError('La cuenta ya se encuentra verificada', { code: 'ACCOUNT_ALREADY_VERIFIED' });

		if (!(await BcryptUtil.compare(code as string, foundUser.signup_code)))
			throw new AuthError('El código de verificación es inválido', {
				code: 'INVALID_VERIFICATION_CODE',
			});

		await this._users.update({ id: foundUser.id }, { signup_code: null, signup_verified_at: new Date() });

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
		const decodedNew = JWTUtil.decodeToken(loginResponse.refreshToken) as {
			jti?: string;
			exp?: number;
		};

		if (decodedNew?.jti && decodedNew?.exp) {
			await this._usersLogins.update(
				{ jti: savedSession.jti, user: foundUser.id },
				{
					jti: decodedNew.jti,
					expires_at: new Date(decodedNew.exp * 1000),
					device: device ?? loginRecord.device ?? 'Unknown Device',
					updated_at: new Date(),
				},
			);
		}

		return loginResponse;
	}

	async logoutUser(accessToken: string | null, refreshToken: string | null): Promise<void> {
		if (!accessToken && !refreshToken) throw new AuthError('No existen tokens vigentes a invalidar');

		const blacklistPromises: Promise<any>[] = [];

		let decodedRefresh: any;
		if (refreshToken) {
			decodedRefresh = JWTUtil.decodeToken(refreshToken);
			blacklistPromises.push(tokenBlacklistService.blacklistToken(refreshToken));
		}
		if (accessToken) {
			blacklistPromises.push(tokenBlacklistService.blacklistToken(accessToken));
		}

		await Promise.all(blacklistPromises);

		if (decodedRefresh?.jti) await this._usersLogins.update({ jti: decodedRefresh.jti }, { token_status: 2 });
	}

	async forgotPassword(userType: number, email: string): Promise<{ message: string }> {
		if (userType !== USER_TYPE_EMPLOYEE && userType !== USER_TYPE_CUSTOMER)
			throw new ValidationError('El tipo de cuenta es inválido', []);
		if (!email) throw new ValidationError('El correo electrónico es requerido', []);

		const foundUser =
			userType === USER_TYPE_EMPLOYEE
				? await this._users.getByEmployeeEmail(email)
				: await this._users.getByClientEmail(email);

		if (foundUser) {
			const resetCode = generateCode();
			const key = `auth:reset:code:${userType}:${email}`;
			await this._cacheClient.set(key, resetCode, 'EX', RESET_CODE_TTL_SECONDS);

			emailService.sendPasswordResetEmail(email, resetCode).catch((err) => {
				Logger.error('Error al enviar correo de restablecimiento de contraseña:', err);
			});
		}

		return {
			message: 'Si el correo está registrado, recibirás un código para restablecer tu contraseña.',
		};
	}

	async verifyResetCode(userType: number, email: string, code: string): Promise<{ resetToken: string }> {
		if (userType !== USER_TYPE_EMPLOYEE && userType !== USER_TYPE_CUSTOMER)
			throw new ValidationError('El tipo de cuenta es inválido', []);
		if (!email || !code) throw new ValidationError('El correo y el código son requeridos', []);

		const foundUser =
			userType === USER_TYPE_EMPLOYEE
				? await this._users.getByEmployeeEmail(email)
				: await this._users.getByClientEmail(email);
		if (!foundUser) throw new AuthError('El código o correo son inválidos', { code: 'INVALID_RESET_CODE' });

		const keyCode = `auth:reset:code:${userType}:${email}`;
		const savedCode = await this._cacheClient.get(keyCode);

		if (!savedCode || savedCode !== code)
			throw new AuthError('El código de verificación no es válido o ha expirado', {
				code: 'INVALID_RESET_CODE',
			});

		await this._cacheClient.del(keyCode);

		const resetToken = generateAccessToken();
		const keyToken = `auth:reset:token:${userType}:${email}`;
		await this._cacheClient.set(keyToken, resetToken, 'EX', RESET_TOKEN_TTL_SECONDS);

		return { resetToken };
	}

	async resetPassword(
		userType: number,
		email: string,
		resetToken: string,
		newPassword: string,
	): Promise<{ message: string }> {
		if (userType !== USER_TYPE_EMPLOYEE && userType !== USER_TYPE_CUSTOMER)
			throw new ValidationError('El tipo de cuenta es inválido', []);
		if (!email || !resetToken || !newPassword) throw new ValidationError('Todos los campos son requeridos', []);

		if (!REGEX.PASSWORD.test(newPassword))
			throw new ValidationError(
				'La contraseña debe tener entre 8 y 20 caracteres y contener al menos un símbolo especial, una letra y un número',
				[],
			);

		const foundUser =
			userType === USER_TYPE_EMPLOYEE
				? await this._users.getByEmployeeEmail(email)
				: await this._users.getByClientEmail(email);
		if (!foundUser) throw new AuthError('El token o correo son inválidos', { code: 'INVALID_RESET_TOKEN' });

		const keyToken = `auth:reset:token:${userType}:${email}`;
		const savedToken = await this._cacheClient.get(keyToken);

		if (!savedToken || savedToken !== resetToken)
			throw new AuthError('El token de restablecimiento no es válido o ha expirado', {
				code: 'INVALID_RESET_TOKEN',
			});

		await this._users.update({ id: foundUser.id }, { password: await BcryptUtil.hash(newPassword) });
		await this._cacheClient.del(keyToken);
		await this._usersLogins.update({ user: foundUser.id }, { token_status: 2 });

		return { message: 'Tu contraseña ha sido restablecida exitosamente. Ahora puedes iniciar sesión.' };
	}
}

export default new AuthService();
