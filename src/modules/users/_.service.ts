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
	private get _cacheClient() {
		return CacheDatabaseProvider.getInstance().client;
	}

	async getUserProfile(userId: number): Promise<UsersWithPeople> {
		const user = await this._users.getFull(userId);
		if (!user) throw new NotFoundError('Usuario', userId.toString());
		return user;
	}

	async updateProfile(userId: number, body: Record<string, any>) {
		const { firstName, lastName, phoneNumber, personalEmail, birthDate, gender } = body;

		// Evitamos que manden contraseñas o emails de login por este medio
		if ('email' in body || 'password' in body || 'currentPassword' in body)
			throw new ValidationError(
				'Las credenciales de acceso deben actualizarse desde el lugar correspondiente.',
				[],
			);

		const user = await this._users.getById(userId);
		if (!user) throw new NotFoundError('Usuario', userId.toString());

		const updateData: any = {};

		if (firstName !== undefined) updateData.first_name = firstName;
		if (lastName !== undefined) updateData.last_name = lastName;
		if (phoneNumber !== undefined) updateData.phone_number = phoneNumber;
		if (personalEmail !== undefined) updateData.personal_email = personalEmail;
		if (birthDate !== undefined) updateData.birth_date = birthDate;
		if (gender !== undefined) updateData.gender = gender;

		if (Object.keys(updateData).length === 0)
			throw new ValidationError('No se enviaron datos válidos para actualizar.', []);

		await this._people.update({ id: user.person }, updateData);
	}

	async updateSecurity(userId: number, body: Record<string, any>): Promise<void> {
		const { currentPassword, email, newPassword } = body;

		if (!currentPassword)
			throw new ValidationError('Debes ingresar tu contraseña actual para confirmar los cambios.', []);

		const user = await this._users.getById(userId);
		if (!user) throw new NotFoundError('Usuario', userId.toString());

		const isPasswordValid = await BcryptUtil.compare(currentPassword, user.password);
		if (!isPasswordValid)
			throw new AuthError('La contraseña actual es incorrecta.', { code: 'INVALID_CREDENTIALS' });

		const updateData: any = {};

		if (email && email !== user.email) {
			if (!REGEX.EMAIL.test(email)) throw new ValidationError('Formato de correo inválido.', []);

			const existingUser = await this._users.getByEmail(email);
			if (existingUser) throw new ValidationError('El correo ya se encuentra en uso por otra cuenta.', []);

			updateData.email = email;
		}

		if (newPassword) {
			if (!BcryptUtil.validatePasswordStrength(newPassword))
				throw new ValidationError('La nueva contraseña no cumple con los criterios de seguridad.', []);

			updateData.password = await BcryptUtil.hash(newPassword);
		}

		if (Object.keys(updateData).length === 0)
			throw new ValidationError('No se enviaron cambios de seguridad a aplicar.', []);

		await this._users.update({ id: userId }, updateData);
	}

	// --- Exclusivo Gerente ---

	async getAllUsers(filters?: any): Promise<{ rows: UsersWithPeople[]; count: number }> {
		return this._users.getAllFull(filters);
	}

	async changeUserStatus(userId: number, status: number) {
		if (status !== 0 && status !== 1)
			throw new ValidationError('El estado debe ser 0 (inactivo/blockear) o 1 (activo/desbloquear).', []);

		// Obtenemos el usuario incluyendo borrados para poder restaurar si está baneado
		const user = await this._users.getByIdIncludingDeleted(userId);
		if (!user) throw new NotFoundError('Usuario', userId.toString());

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

	// --- Endpoints para el usuario autenticado (My)

	async getMyOrders(userId: number, query: Record<string, any>) {
		const user = await this._users.getById(userId, { attributes: ['id', 'person'] });
		if (!user) throw new NotFoundError('Usuario', userId.toString());

		const customer = await this._customers.getOne({ person: user.person });
		if (!customer) return { rows: [], count: 0 };

		const conditions: any = { customer: customer.id };

		if (query.from || query.to) {
			const from = query.from ? new Date(String(query.from)) : null;
			const to = query.to ? new Date(String(query.to)) : null;

			if (from && to)
				conditions.created_at = { [WhereOperators.between]: [from.toISOString(), to.toISOString()] };
			else if (from) conditions.created_at = { [WhereOperators.gte]: from.toISOString() };
			else if (to) conditions.created_at = { [WhereOperators.lte]: to.toISOString() };
		}

		const options: any = {
			count: true,
			relations: ['_OrderLines', '_Tickets', '_OrderPayments', '_Cinemas', '_Customers'],
			attributes: undefined,
			...query,
		};

		const result = await this._orders.getAll(options, conditions);
		return result;
	}

	async getMyOrderTicket(userId: number, orderId: number) {
		const user = await this._users.getById(userId, { attributes: ['id', 'person'] });
		if (!user) throw new NotFoundError('Usuario', userId.toString());

		const customer = await this._customers.getOne({ person: user.person });
		if (!customer) throw new NotFoundError('Cliente', userId.toString());

		const order = await this._orders.getById(orderId);
		if (!order || order.customer !== customer.id) throw new NotFoundError('Orden', String(orderId));

		// Si el repository ya incluye tickets en las relaciones, devolverlos; si no, obtener desde tickets repo
		if (order._Tickets) return order._Tickets;

		const tickets = await this._tickets.getAll({ count: false }, { order: orderId });
		return tickets;
	}

	async getMyLoyaltyInfo(userId: number) {
		const user = await this._users.getById(userId, { attributes: ['id', 'person'] });
		if (!user) throw new NotFoundError('Usuario', userId.toString());

		const customersRepo = this._customers;
		const customer = await customersRepo.getOne({ person: user.person }, { relations: customersRepo.relations });
		if (!customer) return { loyalty_level: null, level_progress_points: 0, points_balance: 0 };

		const loyalty_level = customer.loyalty_level ?? null;
		const loyalty_level_name = customer._LoyaltyLevels ? (customer._LoyaltyLevels as any).name : null;
		const level_progress_points = customer.level_progress_points ?? 0;

		// Obtener último balance de loyalty_ledgers
		const lastLedger = await this._loyaltyLedgers.getAll(
			{ count: false, operation: { order: [['id', 'DESC']], limit: 1 } },
			{ customer: customer.id },
		);

		const points_balance = Array.isArray(lastLedger) && lastLedger.length > 0 ? lastLedger[0].points_balance : 0;

		return { loyalty_level, loyalty_level_name, level_progress_points, points_balance };
	}

	async getMyLoyaltyLedgers(userId: number, queryFilters: Record<string, any>) {
		const user = await this._users.getById(userId, { attributes: ['id', 'person'] });
		if (!user) throw new NotFoundError('Usuario', userId.toString());

		const customersRepo = this._customers;
		const customer = await customersRepo.getOne({ person: user.person }, { relations: customersRepo.relations });
		if (!customer) return { rows: [], count: 0 };

		const paginationOptions: any = { count: true, ...queryFilters };
		const ledgersResult = await this._loyaltyLedgers.getAll(paginationOptions, { customer: customer.id });

		return ledgersResult;
	}

	async getMyMovieSubscriptions(userId: number) {
		const user = await this._users.getById(userId, { attributes: ['id', 'person'] });
		if (!user) throw new NotFoundError('Usuario', userId.toString());

		const customer = await this._customers.getOne({ person: user.person });
		if (!customer) return { rows: [], count: 0 };

		const result = await this._movieSubscriptions.getAll(
			{ count: true, relations: ['_Movies'] },
			{ customer: customer.id, is_notified: false },
		);

		return result;
	}

	// --- Géneros Favoritos
	async getMyMovieGenres(userId: number) {
		const user = await this._users.getById(userId, { attributes: ['id', 'person'] });
		if (!user) throw new NotFoundError('Usuario', userId.toString());

		const customer = await this._customers.getOne({ person: user.person });
		if (!customer) return [];

		const result = await this._customerFavoriteGenres.getAll(
			{ count: false, relations: [{ association: '_Genres' }] },
			{ customer: customer.id },
		);

		return Array.isArray(result) ? result : result.rows;
	}

	async addMyMovieGenres(userId: number, genreIds: number[]) {
		if (!Array.isArray(genreIds) || genreIds.length === 0) {
			throw new ValidationError('Se requiere enviar al menos un género.', []);
		}

		const user = await this._users.getById(userId, { attributes: ['id', 'person'] });
		if (!user) throw new NotFoundError('Usuario', userId.toString());

		const customer = await this._customers.getOne({ person: user.person });
		if (!customer) throw new NotFoundError('Cliente', userId.toString());

		await this._customerFavoriteGenres.transaction(async (transaction: Transaction) => {
			for (const genreId of genreIds) {
				const exists = await this._customerFavoriteGenres.getOne(
					{ customer: customer.id, genre: genreId },
					{ transaction },
				);
				if (!exists) {
					await this._customerFavoriteGenres.create(
						{ customer: customer.id, genre: genreId },
						{ transaction },
					);
				}
			}
		});
	}

	async removeMyMovieGenres(userId: number, genreIds: number[]) {
		if (!Array.isArray(genreIds) || genreIds.length === 0) {
			throw new ValidationError('Se requiere enviar al menos un género a remover.', []);
		}

		const user = await this._users.getById(userId, { attributes: ['id', 'person'] });
		if (!user) throw new NotFoundError('Usuario', userId.toString());

		const customer = await this._customers.getOne({ person: user.person });
		if (!customer) throw new NotFoundError('Cliente', userId.toString());

		await this._customerFavoriteGenres.delete({ customer: customer.id, genre: genreIds });
	}
}

export default new UsersService();
