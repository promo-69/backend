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
		const { employee_id, role_id, email, password } = payload;

		if (!email || !password) {
			throw new ValidationError('Faltan campos obligatorios para la creación de la cuenta.', []);
		}

		if (!employee_id || !role_id) {
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

		const employee = await this._employees.getOne({ id: employee_id });
		if (!employee) {
			throw new NotFoundError('Empleado', employee_id.toString());
		}

		const createdUser = await this._users.create({
			user_type: 1,
			role: role_id,
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

		if (!personData || !personData.first_name || !personData.last_name || !personData.document_number) {
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
					document_number: personData.document_number,
					first_name: personData.first_name,
					last_name: personData.last_name,
					gender: personData.gender,
					phone_number: personData.phone_number,
					personal_email: personData.email || email,
					birth_date: personData.birth_date,
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
		const { phone_number, birth_date, first_name, last_name, personal_email } = body;

		// Bloquear explícitamente cambios de email y password
		if ('email' in body || 'password' in body)
			throw new ValidationError(
				'El email principal y la contraseña no se pueden modificar desde este endpoint',
				[],
			);

		const user = await this._users.getFull(userId);
		if (!user || user.status !== 1) throw new AuthError('Usuario no encontrado o inactivo');

		const updateData: Record<string, any> = {};
		if (phone_number !== undefined) {
			if (!REGEX.PHONE_NUMBER.test(String(phone_number)))
				throw new ValidationError('El número de teléfono no es válido', []);
			updateData.phone_number = phone_number;
		}
		if (birth_date !== undefined) {
			if (!REGEX.DATE.test(String(birth_date)))
				throw new ValidationError('La fecha de nacimiento no es válida', []);
			updateData.birth_date = birth_date;
		}
		if (first_name !== undefined) {
			if (!REGEX.PERSON_NAME.test(String(first_name))) throw new ValidationError('El nombre no es válido', []);
			updateData.first_name = first_name;
		}
		if (last_name !== undefined) {
			if (!REGEX.PERSON_NAME.test(String(last_name))) throw new ValidationError('El apellido no es válido', []);
			updateData.last_name = last_name;
		}
		if (personal_email !== undefined) {
			if (!REGEX.EMAIL.test(String(personal_email)))
				throw new ValidationError('El email personal no es válido', []);
			updateData.personal_email = personal_email;
		}

		if (Object.keys(updateData).length === 0)
			throw new ValidationError('No se proporcionaron datos para actualizar', []);

		await this._people.update(user.person, updateData);

		return null;
	}
}

export default new UsersService();
