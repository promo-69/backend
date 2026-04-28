import { ControllerBase } from '@bases/controller.base.js';
import UsersService from './_.service.js';

class UsersController extends ControllerBase {
	constructor() {
		super();
	}

	async createAccount() {
		const payload = this.getBody();
		await UsersService.createAdministrativeAccount(payload);

		return this.success(null, 'Cuenta de usuario generada exitosamente.');
	}

	async changeStatus() {
		const { id } = this.getParams();
		const { status } = this.getBody();

		const result = await UsersService.updateUserStatus(Number(id), Number(status));

		return this.success(null, result.message);
	}

	// --- Users ---

	async findAllUsers() {
		const data = await UsersService.findAllUsers(this.getQueryFilters());
		return data;
	}

	async findUserById() {
		const { id } = this.getParams();
		const data = await UsersService.findUserById(Number(id));

		return data;
	}

	async createUser() {
		const userData = this.getBody();
		const data = await UsersService.createUser(userData);

		return data;
	}

	// --- Roles ---

	async findAllRoles() {
		const data = await UsersService.findAllRoles(this.getQueryFilters());

		return data;
	}

	async findRoleById() {
		const { id } = this.getParams();

		const data = await UsersService.findRoleById(Number(id));

		return data;
	}

	// --- Permissions ---

	async findAllPermissions() {
		const data = await UsersService.findAllPermissions(this.getQueryFilters());

		return data;
	}

	async findPermissionById() {
		const { id } = this.getParams();

		const data = await UsersService.findPermissionById(Number(id));

		return data;
	}

	async updateProfile() {
		const session = this.getSession<any>();
		const body = this.getBody();

		await UsersService.updateProfile(session.userId, body);

		return this.success(null, 'Perfil actualizado.');
	}
}

export default new UsersController();
