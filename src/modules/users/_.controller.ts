import { ControllerBase } from '@bases/controller.base.js';
import UsersService from './_.service.js';

class UsersController extends ControllerBase {
	constructor() {
		super();
	}

	async getMyProfile() {
		const session = this.getSession();
		const data = await UsersService.getUserProfile(session.userId);
		return this.success(data, 'Perfil recuperado exitosamente.');
	}

	async updateMyProfile() {
		const session = this.getSession();
		await UsersService.updateProfile(session.userId, this.getBody());
		return this.success(null, 'Datos biográficos actualizados correctamente.');
	}

	async updateMySecurity() {
		const session = this.getSession();
		await UsersService.updateSecurity(session.userId, this.getBody());
		return this.success(null, 'Credenciales de seguridad actualizadas correctamente.');
	}

	async getMyOrders() {
		const session = this.getSession();
		const query = this.getQuery();
		const data = await UsersService.getMyOrders(session.userId, query);
		return data;
	}

	async getMyOrderTicket() {
		const session = this.getSession();
		const { orderId } = this.getParams();
		const data = await UsersService.getMyOrderTicket(session.userId, Number(orderId));
		return this.success(data, 'Tickets de la orden recuperados correctamente.');
	}

	async getMyLoyalty() {
		const session = this.getSession();
		const filters = this.getQueryFilters();
		const result = await UsersService.getMyLoyalty(session.userId, filters);

		const ledgers = result.ledgers || { rows: [], count: 0 };
		const pagination = this.getPagination();

		const metadata = {
			loyalty_level: result.loyalty_level,
			level_progress_points: result.level_progress_points,
			points_balance: result.points_balance,
			pagination: { offset: pagination.offset, limit: pagination.limit, total: ledgers.count ?? 0 },
		};

		return this.success(ledgers.rows, 'Loyalty information retrieved.', 200, metadata);
	}

	async getMyMovieSubscriptions() {
		const session = this.getSession();
		const data = await UsersService.getMyMovieSubscriptions(session.userId);
		return data;
	}

	// --- Exclusivo para Gerente

	async getAllUsers() {
		const filters = this.getQueryFilters();
		const data = await UsersService.getAllUsers(filters);
		return data;
	}

	async changeUserStatus() {
		const { id } = this.getParams();
		const { status } = this.getBody(); // 0 = desactivar, 1 = activar
		const result = await UsersService.changeUserStatus(Number(id), Number(status));
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
