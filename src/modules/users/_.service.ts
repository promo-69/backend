import { BaseService } from '@bases/service.base.js';
import { Database } from '@database/index.js';
import { AuthError, ValidationError, NotFoundError } from '@errors';
import { Transaction } from 'sequelize';
import { BcryptUtil } from '@utils/bcrypt.util.js';
import { CacheDatabaseProvider } from '@providers/cache-database.provider.js';
import { REGEX } from '@constants/regex.constant.js';

export class UsersService extends BaseService {
	constructor() {
		super();
	}

	private get _roles() {
		return Database.repository('main', 'roles') as any;
	}
	private get _permisos() {
		return Database.repository('main', 'permissions') as any;
	}
	private get _users() {
		return Database.repository('main', 'users') as any;
	}
	private get _people() {
		return Database.repository('main', 'people') as any;
	}
	private get _employees() {
		return Database.repository('main', 'employees') as any;
	}
	private get _customers() {
		return Database.repository('main', 'customers') as any;
	}
	private get _usersLogins() {
		return Database.repository('main', 'users-logins') as any;
	}
	private get _cacheClient() {
		return CacheDatabaseProvider.getInstance().client;
	}

	async createAdministrativeAccount(payload: any) {
		const { employeeId, roleId, email, password } = payload;

		if (!email || !password) {
			throw new ValidationError('Faltan campos obligatorios para la creación de la cuenta.', []);
		}

		if (!employeeId || !roleId) {
			throw new ValidationError(
				'El ID del empleado y el rol son obligatorios para crear una cuenta de empleado.',
				[],
			);
		}

		const existingUser = await this._users.getByEmail(email);
		if (existingUser) {
			throw new AuthError('El usuario ya existe con este correo', { code: 'USER_ALREADY_EXISTS' });
		}

		const hashedPassword = await BcryptUtil.hash(password);

		const employee = await this._employees.getOne({ id: employeeId });
		if (!employee) {
			throw new NotFoundError('Empleado', employeeId.toString());
		}

		const createdUser = await this._users.create({
			user_type: 1,
			role: roleId,
			person: employee.person,
			email,
			password: hashedPassword,
			status: 1,
			signup_verified_at: new Date(),
		});

		return createdUser;
	}

	async createClientAccount(payload: any) {
		const { email, password, personData } = payload;

		if (!email || !password) {
			throw new ValidationError('Faltan campos obligatorios para la creación de la cuenta.', []);
		}

		if (!personData || !personData.firstName || !personData.lastName || !personData.documentNumber) {
			throw new ValidationError('Los datos de la persona son obligatorios para un cliente.', []);
		}

		const existingUser = await this._users.getByEmail(email);
		if (existingUser) {
			throw new AuthError('El usuario ya existe con este correo', { code: 'USER_ALREADY_EXISTS' });
		}

		const hashedPassword = await BcryptUtil.hash(password);

		const created = await this._users.transaction(async (transaction: Transaction) => {
			const createdPerson = await this._people.create(
				{
					document_number: personData.documentNumber,
					first_name: personData.firstName,
					last_name: personData.lastName,
					gender: personData.gender,
					phone_number: personData.phoneNumber,
					personal_email: personData.email || email,
					birth_date: personData.birthDate,
					status: 1,
				},
				{ transaction },
			);

			await this._customers.create(
				{
					person: createdPerson.id,
					loyalty_level: 1,
					level_progress_points: 0,
					status: 1,
				},
				{ transaction },
			);

			const createdUser = await this._users.create(
				{
					user_type: 2,
					person: createdPerson.id,
					email,
					password: hashedPassword,
					status: 1,
					signup_verified_at: new Date(),
				},
				{ transaction },
			);

			return createdUser;
		});

		return created;
	}

	async updateUserStatus(userId: number, status: number) {
		if (status !== 0 && status !== 1)
			throw new ValidationError('El estado debe ser 0 (inactivo) o 1 (activo).', []);

		const user = await this._users.getOne({ id: userId });
		if (!user) throw new NotFoundError('Usuario', userId.toString());

		await this._users.update({ id: userId }, { status });

		if (status === 0) {
			// Revocar sesiones activas
			const activeSessions = await this._usersLogins.getAll({ user: userId, status: 1 });

			if (activeSessions && activeSessions.rows && activeSessions.rows.length > 0) {
				const blacklistPromises = [];
				const now = Math.floor(Date.now() / 1000);

				for (const session of activeSessions.rows) {
					const expiresAt = Math.floor(new Date(session.expires_at).getTime() / 1000);
					const ttl = expiresAt - now;

					if (ttl > 0 && session.jti) {
						const key = `auth:bl:${session.jti}`;
						blacklistPromises.push(this._cacheClient.set(key, 'blacklisted', 'EX', ttl, 'NX'));
					}
				}

				await Promise.all(blacklistPromises);

				// Actualizar estado en DB
				await this._usersLogins.update({ user: userId }, { status: 2, token_status: 2 });
			}
		}

		return {
			status: 'success',
			message:
				status === 0
					? 'El acceso de la cuenta ha sido suspendido.'
					: 'El acceso de la cuenta ha sido reactivado.',
		};
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

	async updateProfile(userId: number, body: Record<string, any>) {
		const { phoneNumber, birthDate, firstName, lastName, personalEmail } = body;

		// Bloquear explícitamente cambios de email y password
		if ('email' in body || 'password' in body)
			throw new ValidationError(
				'El email principal y la contraseña no se pueden modificar desde este endpoint',
				[],
			);

		const user = await this._users.getFull(userId);
		if (!user || user.status !== 1) throw new AuthError('Usuario no encontrado o inactivo');

		const updateData: Record<string, any> = {};
		if (phoneNumber !== undefined) {
			if (!REGEX.PHONE_NUMBER.test(String(phoneNumber)))
				throw new ValidationError('El número de teléfono no es válido', []);
			updateData.phone_number = phoneNumber;
		}
		if (birthDate !== undefined) {
			if (!REGEX.DATE.test(String(birthDate)))
				throw new ValidationError('La fecha de nacimiento no es válida', []);
			updateData.birth_date = birthDate;
		}
		if (firstName !== undefined) {
			if (!REGEX.PERSON_NAME.test(String(firstName))) throw new ValidationError('El nombre no es válido', []);
			updateData.first_name = firstName;
		}
		if (lastName !== undefined) {
			if (!REGEX.PERSON_NAME.test(String(lastName))) throw new ValidationError('El apellido no es válido', []);
			updateData.last_name = lastName;
		}
		if (personalEmail !== undefined) {
			if (!REGEX.EMAIL.test(String(personalEmail)))
				throw new ValidationError('El email personal no es válido', []);
			updateData.personal_email = personalEmail;
		}

		if (Object.keys(updateData).length === 0)
			throw new ValidationError('No se proporcionaron datos para actualizar', []);

		await this._people.update(user.person, updateData);

		return null;
	}

	async updateSecurity(userId: number, body: Record<string, any>) {
		const { currentPassword, newPassword, email } = body;

		if (!currentPassword || typeof currentPassword !== 'string')
			throw new ValidationError('La contraseña actual es obligatoria.', []);

		const user = await this._users.getFull(userId);
		if (!user || user.status !== 1) throw new AuthError('Usuario no encontrado o inactivo');

		const isPasswordValid = await BcryptUtil.compare(currentPassword, user.password);
		if (!isPasswordValid) throw new AuthError('La contraseña actual es incorrecta.', { code: 'INVALID_CURRENT_PASSWORD' });

		const updateData: Record<string, any> = {};

		if (email !== undefined) {
			if (!REGEX.EMAIL.test(String(email)))
				throw new ValidationError('El email proporcionado no es válido.', []);

			const existingUser = await this._users.getByEmail(email);
			if (existingUser && existingUser.id !== userId)
				throw new AuthError('Ya existe otra cuenta con el email ingresado.', { code: 'EMAIL_ALREADY_IN_USE' });

			updateData.email = email;
		}

		if (newPassword !== undefined) {
			if (typeof newPassword !== 'string' || newPassword.trim().length === 0)
				throw new ValidationError('La nueva contraseña no puede estar vacía.', []);

			if (!BcryptUtil.validatePasswordStrength(newPassword))
				throw new ValidationError(
					'La nueva contraseña debe tener al menos 6 caracteres e incluir letras y números.',
					[],
				);

			updateData.password = await BcryptUtil.hash(newPassword);
		}

		if (Object.keys(updateData).length === 0)
			throw new ValidationError('Debe proporcionar email o nueva contraseña para actualizar.', []);

		await this._users.update({ id: userId }, updateData);

		return null;
	}
}

export default new UsersService();
