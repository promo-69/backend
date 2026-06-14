import { ControllerBase } from '@bases/controller.base.js';
import UsersService from './_.service.js';
import { CustomerUserSession } from '@rules/api.type.js';

class UsersController extends ControllerBase {
	constructor() {
		super();
	}

	async getMyProfile() {
		const data = await UsersService.getUserProfile(this.getSession().userId);

		return this.success(data, 'Perfil recuperado exitosamente.');
	}

	async updateMyProfile() {
		await UsersService.updateProfile(this.getSession().userId, this.getBody());

		return this.success(null, 'Datos biográficos actualizados correctamente.');
	}

	async updateMySecurity() {
		await UsersService.updateSecurity(this.getSession().userId, this.getBody());

		return this.success(null, 'Credenciales de seguridad actualizadas correctamente.');
	}

	// -- Órdenes del Consumidor

	async getMyOrders() {
		const data = await UsersService.getMyOrders(this.getSession() as CustomerUserSession, this.getQuery());

		return this.success(data, 'Ordenes recuperadas correctamente.');
	}

	async getMyOrderTicket() {
		const data = await UsersService.getMyOrderTicket(this.getSession() as CustomerUserSession, this.getParams());

		return this.success(data, 'Tickets de la orden recuperados correctamente.');
	}

	// -- Lealtad del Consumidor

	async getMyLoyaltyInfo() {
		const data = await UsersService.getMyLoyaltyInfo(this.getSession() as CustomerUserSession);

		return this.success(data, 'Recibida información de lealtad');
	}

	async getMyLoyaltyLedgers() {
		const data = await UsersService.getMyLoyaltyLedgers(
			this.getSession() as CustomerUserSession,
			this.getQueryFilters(),
		);

		return this.success(data, 'Balance de lealtad recuperados correctamente');
	}

	// --- Subscripciones a Películas por el Consumidor

	async getMyMovieSubscriptions() {
		const data = await UsersService.getMyMovieSubscriptions(
			this.getSession() as CustomerUserSession,
			this.getQueryFilters(),
		);

		return this.success(data, 'Suscripciones de películas recuperadas exitosamente.');
	}

	async addMyMovieSubscriptions() {
		await UsersService.addMyMovieSubscriptions(this.getSession() as CustomerUserSession, this.getBody());

		return this.success(null, 'Suscripciones agregadas correctamente.');
	}

	async removeMyMovieSubscription() {
		await UsersService.removeMyMovieSubscription(
			this.getSession() as CustomerUserSession,
			this.getParams().movieId ?? this.getBody(),
		);

		return this.success(null, 'Suscripción removida correctamente.');
	}

	// --- Géneros Favoritos del Consumidor

	async getMyMovieGenres() {
		const data = await UsersService.getMyMovieGenres(
			this.getSession() as CustomerUserSession,
			this.getQueryFilters(),
		);

		return this.success(data, 'Géneros favoritos recuperados exitosamente.');
	}

	async addMyMovieGenres() {
		await UsersService.addMyMovieGenres(this.getSession() as CustomerUserSession, this.getBody());

		return this.success(null, 'Géneros favoritos actualizados correctamente.');
	}

	async removeMyMovieGenres() {
		await UsersService.removeMyMovieGenres(
			this.getSession() as CustomerUserSession,
			this.getParams().genreId ?? this.getBody(),
		);

		return this.success(null, 'Géneros favoritos removidos correctamente.');
	}

	// --- Exclusivo para Gerente

	async getAllUsers() {
		const data = await UsersService.getAllUsers(this.getQueryFilters());

		return this.success(data, 'Usuarios recuperados correctamente.');
	}

	async changeUserStatus() {
		const { id } = this.getParams();
		const result = await UsersService.changeUserStatus(Number(id), this.getBody());

		return this.success(null, result.message);
	}

	async getUserRole() {
		const { id } = this.getParams();

		const data = await UsersService.getUserRole(Number(id));

		return this.success(data, 'Rol de usuario recuperado correctamente.');
	}

	async assignUserRole() {
		const { id } = this.getParams();

		await UsersService.assignUserRole(Number(id), this.getBody());

		return this.success(null, 'Rol asignado al usuario correctamente.');
	}

	async removeUserRole() {
		const { id } = this.getParams();

		await UsersService.removeUserRole(Number(id));

		return this.success(null, 'Rol removido del usuario correctamente.');
	}

	async getUserPermissions() {
		const { id } = this.getParams();

		const data = await UsersService.getUserPermissions(Number(id));

		return this.success(data, 'Permisos de usuario recuperados correctamente.');
	}

	async assignUserPermissions() {
		const { id } = this.getParams();

		await UsersService.assignUserPermissions(Number(id), this.getBody());

		return this.success(null, 'Permisos asignados al usuario correctamente.');
	}

	async removeUserPermissions() {
		const { id } = this.getParams();

		await UsersService.removeUserPermissions(Number(id), this.getBody());

		return this.success(null, 'Permisos removidos del usuario correctamente.');
	}
}

export default new UsersController();
