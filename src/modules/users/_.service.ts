import { BaseService } from '@bases/service.base.js';
import { Database } from '@database/index.js';
import { AuthError, ValidationError, NotFoundError } from '@errors';
import { Transaction } from 'sequelize';
import { BcryptUtil } from '@utils/bcrypt.util.js';
import { convertCase } from '@utils/string-formatters.util.js';
import { CacheDatabaseProvider } from '@providers/cache-database.provider.js';

export class UsersService extends BaseService {
	constructor() {
		super();
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
		const { user_type, employee_id, role_id, email, password, personData } = payload;

		if (!user_type || !email || !password) {
			throw new ValidationError('Faltan campos obligatorios para la creación de la cuenta.', []);
		}

		const existingUser = await this._users.getByEmail(email);
		if (existingUser) {
			throw new AuthError('El usuario ya existe con este correo', { code: 'USER_ALREADY_EXISTS' });
		}

		const hashedPassword = await BcryptUtil.hash(password);

		if (user_type === 1) {
			// Empleado
			if (!employee_id || !role_id) {
				throw new ValidationError('El ID del empleado y el rol son obligatorios para crear una cuenta de empleado.', []);
			}

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
				signup_verified_at: new Date()
			});

			return createdUser;
		} else if (user_type === 2) {
			// Cliente
			if (!personData || !personData.first_name || !personData.last_name || !personData.document_number) {
				throw new ValidationError('Los datos de la persona son obligatorios para un cliente.', []);
			}

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
						status: 1
					},
					{ transaction }
				);

				await this._customers.create(
					{
						person: createdPerson.id,
						loyalty_level: 1,
						level_progress_points: 0,
						status: 1
					},
					{ transaction }
				);

				const createdUser = await this._users.create(
					{
						user_type: 2,
						person: createdPerson.id,
						email,
						password: hashedPassword,
						status: 1,
						signup_verified_at: new Date()
					},
					{ transaction }
				);

				return createdUser;
			});

			return created;
		} else {
			throw new ValidationError('Tipo de usuario inválido.', []);
		}
	}

	async updateUserStatus(userId: number, status: number) {
		if (status !== 0 && status !== 1) {
			throw new ValidationError('El estado debe ser 0 (inactivo) o 1 (activo).', []);
		}

		const user = await this._users.getOne({ id: userId });
		if (!user) {
			throw new NotFoundError('Usuario', userId.toString());
		}

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
			message: status === 0 ? 'El acceso de la cuenta ha sido suspendido.' : 'El acceso de la cuenta ha sido reactivado.'
		};
	}
}

export default new UsersService();
