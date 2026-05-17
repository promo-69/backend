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
}

export default new UsersController();
