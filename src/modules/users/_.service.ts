import { BaseService } from '@bases/service.base.js';
import { Database } from '@database/index.js';
import { AuthError, ValidationError, NotFoundError } from '@errors/index.js';
import { BcryptUtil } from '@utils/bcrypt.util.js';
import { CacheDatabaseProvider } from '@providers/cache-database.provider.js';
import { REGEX } from '@constants/regex.constant.js';
import { type UsersWithPeople } from '@repositories/main/users.repository.js';
import { tokenBlacklistService } from '@services/token-blacklist.service.js';

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
}

export default new UsersService();
