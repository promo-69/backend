import { BaseService } from '@bases/service.base.js';
import type { Transaction } from 'sequelize';
import { Database } from '@database/index.js';
import { AuthError, ValidationError, NotFoundError } from '@errors/index.js';
import { BcryptUtil } from '@utils/bcrypt.util.js';
import { CacheDatabaseProvider } from '@providers/cache-database.provider.js';
import { REGEX } from '@constants/regex.constant.js';
import { type UsersWithPeople } from '@repositories/main/users.repository.js';
import { tokenBlacklistService } from '@services/token-blacklist.service.js';
import { WhereOperators } from '@bases/repository.base.js';
import { USER_TYPE } from '@constants/magic-numbers.constant.js';
import { CustomerUserSession } from '@rules/api.type.js';
import { ProcessedQueryFilters } from '@rules/api-query.type.js';

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
	private get _usersLogins() {
		return Database.repository('main', 'users-logins') as any;
	}
	private get _orders() {
		return Database.repository('main', 'orders') as any;
	}
	private get _tickets() {
		return Database.repository('main', 'tickets') as any;
	}
	private get _customers() {
		return Database.repository('main', 'customers') as any;
	}
	private get _loyaltyLedgers() {
		return Database.repository('main', 'loyalty-ledgers') as any;
	}
	private get _movieSubscriptions() {
		return Database.repository('main', 'movie-user-subscriptions') as any;
	}
	private get _customerFavoriteGenres() {
		return Database.repository('main', 'customer-favorite-genres') as any;
	}
	private get _roles() {
		return Database.repository('main', 'roles') as any;
	}
	private get _permissions() {
		return Database.repository('main', 'permissions') as any;
	}
	private get _userPermissions() {
		return Database.repository('main', 'user-permissions') as any;
	}
	private get _movies() {
		return Database.repository('main', 'movies') as any;
	}
	private get _genres() {
		return Database.repository('main', 'genres') as any;
	}

	async getUserProfile(userId: number): Promise<any> {
		const user = await this._users.getFull(userId);

		if (!user) throw new NotFoundError('Usuario', userId.toString());

		const userObj = JSON.parse(JSON.stringify(user));
		const resultUser: any = {
			id: userObj.id,
			person: userObj.person,
			user_type: userObj.user_type,
			role: userObj?.role ?? undefined,
			role_desc: userObj?._Roles?.name,
			email: userObj.email,
			signup_verified_at: userObj.signup_verified_at,
			created_at: userObj.created_at,
			user_type_desc: userObj._UserTypes.description,
			_People: {
				id: userObj._People.id,
				first_name: userObj._People.first_name,
				last_name: userObj._People.last_name,
				phone_number: userObj._People.phone_number,
				personal_email: userObj._People.personal_email,
				birth_date: userObj._People.birth_date,
				gender: userObj._People.gender,
				_Genders: userObj._People._Genders,
			},
		};

		if (userObj.user_type === USER_TYPE.CUSTOMER) {
			const customer = await this._customers.getOne(
				{ person: userObj.person },
				{ relations: this._customers._relations },
			);

			if (customer)
				resultUser._Customer = {
					id: customer.id,
					loyalty_level: customer.loyalty_level,
					level_progress_points: customer.level_progress_points,
					registration_date: customer.registration_date,
					_LoyaltyLevels: customer._LoyaltyLevels,
				};
		} else if (userObj.user_type === USER_TYPE.EMPLOYEE) {
			const employee = await this._employees.getOne(
				{ person: userObj.person },
				{
					relations: this._employees._relations,
				},
			);

			if (employee) {
				const activePosition = employee._EmployeePositions[0];

				resultUser._Employees = {
					id: employee.id,
					employee_code: employee.employee_code,
					_EmployeePositions: {
						job_position: activePosition.job_position,
						cinema: activePosition.cinema,
						start_date: activePosition.start_date,
						end_date: activePosition.end_date,
						salary_base: Number(activePosition.salary_base),
						_JobPositions: activePosition._JobPositions,
					},
				};
			}
		}

		return resultUser;
	}

	async updateProfile(userId: number, data: Record<string, any>) {
		const { firstName, lastName, phoneNumber, personalEmail, birthDate, gender } = data;

		// Evitamos que manden contraseñas o emails de login por este medio
		if (['email', 'password', 'currentPassword'].some((key) => key in data))
			throw new ValidationError(
				'Las credenciales de acceso deben actualizarse desde el lugar correspondiente.',
				[],
			);

		await this._users.transaction(async (transaction: Transaction) => {
			const user = await this._users.getById(userId, { transaction, lock: transaction.LOCK.UPDATE });
			const updateData: any = {};

			if (firstName !== undefined) {
				this.validateType({ firstName }, 'string');
				updateData.first_name = firstName;
			}
			if (lastName !== undefined) {
				this.validateType({ lastName }, 'string');
				updateData.last_name = lastName;
			}
			if (phoneNumber !== undefined) {
				this.validateType({ phoneNumber }, 'string');
				updateData.phone_number = phoneNumber;
			}
			if (personalEmail !== undefined) {
				this.validateType({ personalEmail }, 'string');
				updateData.personal_email = personalEmail;
			}
			if (birthDate !== undefined) {
				this.validateType({ birthDate }, 'string');
				updateData.birth_date = birthDate;
			}
			if (gender !== undefined) {
				this.validatePattern({ gender }, REGEX.DATABASE_ID);
				updateData.gender = gender;
			}

			if (Object.keys(updateData).length === 0)
				throw new ValidationError('No se enviaron datos para actualizar.', []);

			await this._people.update({ id: user.person }, updateData, { transaction });
		});
	}

	async updateSecurity(userId: number, data: Record<string, any>): Promise<void> {
		const { currentPassword, email, newPassword } = data;

		if (!currentPassword)
			throw new ValidationError('Debes ingresar tu contraseña actual para confirmar los cambios.', []);

		const user = await this._users.getById(userId);
		const isPasswordValid = await BcryptUtil.compare(currentPassword, user.password);
		if (!isPasswordValid)
			throw new AuthError('La contraseña actual es incorrecta.', { code: 'INVALID_CREDENTIALS' });

		const updateData: any = {};

		/*if (email && email !== user.email) {
			if (!REGEX.EMAIL.test(email)) throw new ValidationError('Formato de correo inválido.', []);

			const existingUser = await this._users.getByEmail(email);
			if (existingUser) throw new ValidationError('El correo ya se encuentra en uso por otra cuenta.', []);

			updateData.email = email;
		}*/

		if (newPassword) {
			if (!BcryptUtil.validatePasswordStrength(newPassword))
				throw new ValidationError('La nueva contraseña no cumple con los criterios de seguridad.', []);

			updateData.password = await BcryptUtil.hash(newPassword);
		}

		if (Object.keys(updateData).length === 0)
			throw new ValidationError('No se enviaron cambios de seguridad a aplicar.', []);

		await this._users.update({ id: userId }, updateData);
	}

	// --- En relación a las compras realizadas

	async getMyOrders(session: CustomerUserSession, query: Record<string, any>) {
		if (!session.customerId) throw new AuthError('No tiene un perfil de cliente.');

		const conditions: any = { customer: session.customerId };

		if (query.from || query.to) {
			const from = query.from ? new Date(String(query.from)) : null;
			const to = query.to ? new Date(String(query.to)) : null;

			if (from && to)
				conditions.created_at = { [WhereOperators.between]: [from.toISOString(), to.toISOString()] };
			else if (from) conditions.created_at = { [WhereOperators.gte]: from.toISOString() };
			else if (to) conditions.created_at = { [WhereOperators.lte]: to.toISOString() };
		}

		const result = await this._orders.getAll(
			{ relations: ['_OrderLines', '_Tickets', '_OrderPayments', '_Cinemas', '_Customers'] },
			conditions,
		);

		return result;
	}

	async getMyOrderTicket(session: CustomerUserSession, orderId: number) {
		if (!session.customerId) throw new AuthError('No tiene un perfil de cliente.');

		this.validateRegexpFields([
			{ value: orderId, regex: REGEX.DATABASE_ID, message: 'El dato de la orden no es válido' },
		]);

		const order = await this._orders.getById(orderId);
		if (!order || order.customer !== session.customerId)
			throw new NotFoundError('No se encontro la orden solicitada');

		return order._Tickets;
	}

	// --- Lealtad del Consumidor

	async getMyLoyaltyInfo(session: CustomerUserSession) {
		if (!session.customerId) throw new AuthError('No tiene un perfil de cliente.');

		const customer = await this._customers.getById(session.customerId, { relations: this._customers._relations });
		const loyalty_level = customer.loyalty_level ?? null;
		const loyalty_level_name = customer._LoyaltyLevels ? (customer._LoyaltyLevels as any).name : null;
		const level_progress_points = customer.level_progress_points ?? 0;

		// Obtener último balance de loyalty_ledgers
		const lastLedger = await this._loyaltyLedgers.getAll(
			{ count: false, operation: { order: [['id', 'DESC']], limit: 1 } },
			{ customer: customer.id },
		);

		const points_balance = lastLedger?.[0]?.points_balance ?? 0;

		return { loyalty_level, loyalty_level_name, level_progress_points, points_balance };
	}

	async getMyLoyaltyLedgers(session: CustomerUserSession, queryFilters: Record<string, any>) {
		if (!session.customerId) throw new AuthError('No tiene un perfil de cliente.');

		const ledgersResult = await this._loyaltyLedgers.getAll(queryFilters, { customer: session.customerId });

		return ledgersResult;
	}

	// --- Subscripciones a Películas

	async getMyMovieSubscriptions(session: CustomerUserSession, queryFilters: ProcessedQueryFilters) {
		if (!session.customerId) throw new AuthError('No tiene un perfil de cliente.');

		const result = await this._movieSubscriptions.getAll(
			{
				attributes: ['id', 'movie', 'is_notified'],
				relations: [
					{
						association: '_Movies',
						attributes: [
							'id',
							'title',
							'release_date',
							'duration_minutes',
							'lifecycle_state',
							'poster_url',
						],
					},
				],
				...queryFilters,
			},
			{ customer: session.customerId },
		);

		return result;
	}

	async addMyMovieSubscriptions(session: CustomerUserSession, data: Record<string, number>) {
		if (!session.customerId) throw new AuthError('No tiene un perfil de cliente.');
		this.validateRequired(data, ['movie']);
		this.validateRegexpFields([
			{ value: data.movieId, regex: REGEX.DATABASE_ID, message: 'El dato de la película no es válido' },
		]);

		const movieId = Number(data.movieId);

		await this._movieSubscriptions.transaction(async (transaction: Transaction) => {
			const exists = await this._movieSubscriptions.getOne(
				{ customer: session.customerId, movie: movieId },
				{ transaction },
			);
			if (exists) return;

			const existMovie = await this._movies.getById(movieId);
			if (!existMovie) throw new ValidationError('Solo se permite subscribirse a películas que existan.');

			await this._movieSubscriptions.create({ customer: session.customerId, movie: movieId }, { transaction });
		});
	}

	async removeMyMovieSubscription(session: CustomerUserSession, movieIds: string | number) {
		if (!session.customerId) throw new AuthError('No tiene un perfil de cliente.');
		if (Array.isArray(movieIds) && movieIds.length === 0)
			throw new ValidationError('Se requiere enviar al menos un género.');

		const _movieIds: Array<string | number> = !Array.isArray(movieIds) ? [movieIds] : movieIds;

		for (const index in _movieIds) {
			const movieId = _movieIds[index];

			this.validateRegexpFields([
				{ value: movieId, regex: REGEX.DATABASE_ID, message: 'El dato de la película debe ser numérico' },
			]);

			_movieIds[index] = Number(movieId);
		}

		await this._movieSubscriptions.delete({ customer: session.customerId, movie: _movieIds });
	}

	// --- Géneros Favoritos

	async getMyMovieGenres(session: CustomerUserSession, queryFilters: ProcessedQueryFilters) {
		if (!session.customerId) throw new AuthError('No tiene un perfil de cliente.');

		const result = await this._customerFavoriteGenres.getAll(
			{
				relations: [{ association: '_Genres', attribute: ['id', 'description'] }],
				...queryFilters,
			},
			{ customer: session.customerId },
		);

		return { ...result, rows: result.rows.map((item: any) => item._Genres) };
	}

	async addMyMovieGenres(session: CustomerUserSession, genreIds: number[]) {
		if (!session.customerId) throw new AuthError('No tiene un perfil de cliente.');
		if (!Array.isArray(genreIds) || genreIds.length === 0)
			throw new ValidationError('Se requiere enviar al menos un género.', []);

		const _genreIds = genreIds.map((genreId: string | number) => {
			this.validateRegexpFields([
				{ value: genreId, regex: REGEX.DATABASE_ID, message: 'El dato del género debe ser numérico' },
			]);

			return { customer: session.customerId, genre: Number(genreId) };
		});

		const existGenres = await this._genres.count({ id: _genreIds.map((genreId: any) => genreId.genre) });
		if (existGenres < _genreIds.length) throw new ValidationError('Solo se permiten géneros que existan.');

		await this._customerFavoriteGenres.bulkCreate(_genreIds, {
			ignoreDuplicates: true,
			ignoreFields: ['customer', 'genre'],
		});
	}

	async removeMyMovieGenres(session: CustomerUserSession, genreIds: string | number[]) {
		if (!session.customerId) throw new AuthError('No tiene un perfil de cliente.');
		if (Array.isArray(genreIds) && genreIds.length === 0)
			throw new ValidationError('Se requiere enviar al menos un género.');

		const _genreIds: Array<string | number> = !Array.isArray(genreIds) ? [genreIds] : genreIds;

		for (const index in _genreIds) {
			const genreId = _genreIds[index];

			this.validateRegexpFields([
				{ value: genreId, regex: REGEX.DATABASE_ID, message: 'El dato del género debe ser numérico' },
			]);

			_genreIds[index] = Number(genreId);
		}

		await this._customerFavoriteGenres.delete({ customer: session.customerId, genre: _genreIds });
	}

	// --- Exclusivo Gerente ---

	async getAllUsers(filters?: any): Promise<{ rows: UsersWithPeople[]; count: number }> {
		return this._users.getAllFull({
			...filters,
			attributes: ['id', 'person', 'user_type', 'role', 'email', 'signup_verified_at', 'created_at'],
			relations: this._users._relations,
		});
	}

	async changeUserStatus(userId: number, status: number) {
		if (status !== 0 && status !== 1)
			throw new ValidationError('El estado debe ser 0 (inactivo/blockear) o 1 (activo/desbloquear).', []);

		// Obtenemos el usuario incluyendo borrados para poder restaurar si está baneado
		const user = await this._users.getByIdIncludingDeleted(userId);
		if (!user) throw new NotFoundError('No se encontró ningún usuario con esa referencia.');

		if (status === 0) {
			// Banear -> Borrado Lógico
			await this._users.delete(userId);

			// Invalidar sesiones activas de Redis
			const { rows: activeSessions } = await this._usersLogins.getAll({}, { user: userId });

			if (activeSessions && activeSessions.length > 0) {
				const blacklistPromises: Promise<any>[] = [];

				// Iteramos sobre el arreglo real
				for (const session of activeSessions) {
					const expiresAt = Math.floor(new Date(session.expires_at).getTime() / 1000);

					if (session.jti) blacklistPromises.push(tokenBlacklistService.blacklistJti(session.jti, expiresAt));
				}

				await Promise.all(blacklistPromises);
				await this._usersLogins.update({ user: userId }, { token_status: 2 });
			}

			return { message: 'Usuario baneado (acceso suspendido) exitosamente.' };
		} else {
			await this._users.restore(userId);

			return { message: 'Usuario desbaneado (acceso reactivado) exitosamente.' };
		}
	}

	private validatePositiveInteger(value: any, fieldName: string) {
		if (typeof value !== 'number' || !Number.isInteger(value) || value <= 0)
			throw new ValidationError(`El campo ${fieldName} debe ser un número entero positivo.`, []);
	}

	private validatePermissionsArray(value: any) {
		if (!Array.isArray(value) || value.length === 0)
			throw new ValidationError('Se debe enviar al menos un permiso.', []);

		const invalidItems = value.filter(
			(permission: any) => typeof permission !== 'number' || !Number.isInteger(permission) || permission <= 0,
		);
		if (invalidItems.length > 0)
			throw new ValidationError('Todos los IDs de permisos deben ser números enteros positivos.', []);
	}

	private ensureNotSuperAdmin(userId: number) {
		if (userId === 1)
			throw new ValidationError('No se puede modificar el rol o permisos del superadministrador.', []);
	}

	async getUserRole(userId: number) {
		const user = await this._users.getById(userId, { attributes: ['id', 'role'] });
		if (!user) throw new NotFoundError('Usuario', userId.toString());

		if (!user.role) return null;

		const role = await this._roles.getById(user.role);
		if (!role) throw new NotFoundError('Rol', user.role.toString());

		return role;
	}

	async assignUserRole(userId: number, body: Record<string, any>) {
		this.ensureNotSuperAdmin(userId);
		const { roleId } = body;
		if (roleId === undefined || roleId === null) throw new ValidationError('El rol es requerido.', []);
		this.validatePositiveInteger(roleId, 'roleId');

		const user = await this._users.getByIdIncludingDeleted(userId);
		if (!user) throw new NotFoundError('Usuario', userId.toString());

		const role = await this._roles.getById(roleId);
		if (!role) throw new NotFoundError('Rol', roleId.toString());

		await this._users.update({ id: userId }, { role: roleId });
	}

	async removeUserRole(userId: number) {
		this.ensureNotSuperAdmin(userId);
		const user = await this._users.getById(userId);
		if (!user) throw new NotFoundError('Usuario', userId.toString());
		if (!user.role) throw new ValidationError('El usuario no tiene un rol asignado.', []);

		await this._users.update({ id: userId }, { role: null });
	}

	async getUserPermissions(userId: number) {
		const user = await this._users.getById(userId);
		if (!user) throw new NotFoundError('Usuario', userId.toString());

		const result = await this._userPermissions.getAll(
			{
				count: true,
				relations: [
					{
						association: '_Permissions',
						attributes: ['id', 'action', 'resource', 'permission_type'],
						required: true,
					},
				],
			},
			{ user: userId },
		);

		return result.rows;
	}

	async assignUserPermissions(userId: number, body: Record<string, any>) {
		this.ensureNotSuperAdmin(userId);
		const { permissions } = body;
		this.validatePermissionsArray(permissions);

		const user = await this._users.getByIdIncludingDeleted(userId);
		if (!user) throw new NotFoundError('Usuario', userId.toString());

		const existingPermissions = await this._permissions.getAll({ count: false }, { id: permissions });
		const existingIds = Array.isArray(existingPermissions) ? existingPermissions.map((item: any) => item.id) : [];
		const missingPermissions = permissions.filter((permissionId: any) => !existingIds.includes(permissionId));
		if (missingPermissions.length > 0) throw new NotFoundError('Permiso(s)', missingPermissions.join(', '));

		await this._userPermissions.transaction(async (transaction: Transaction) => {
			for (const permissionId of permissions) {
				const existingRecord = await this._userPermissions.getOne(
					{ user: userId, permission: permissionId },
					{ paranoid: false, transaction },
				);

				if (existingRecord) {
					if ((existingRecord as any).deleted_at !== null) {
						await this._userPermissions.restore({ id: (existingRecord as any).id }, { transaction });
					}

					if ((existingRecord as any).is_granted !== true) {
						await this._userPermissions.update(
							{ id: (existingRecord as any).id },
							{ is_granted: true },
							{ transaction },
						);
					}
				} else {
					await this._userPermissions.create(
						{ user: userId, permission: permissionId, is_granted: true },
						{ transaction },
					);
				}
			}
		});
	}

	async removeUserPermissions(userId: number, body: Record<string, any>) {
		this.ensureNotSuperAdmin(userId);
		const { permissions } = body;
		this.validatePermissionsArray(permissions);

		const user = await this._users.getById(userId);
		if (!user) throw new NotFoundError('Usuario', userId.toString());

		const deletedRows = await this._userPermissions.delete({ user: userId, permission: permissions });
		if (!deletedRows) throw new NotFoundError('Permiso(s) no encontrado(s) para el usuario', userId.toString());
	}
}

export default new UsersService();
