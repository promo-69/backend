import { ControllerBase } from '@bases/controller.base.js';
import RolesService from './_.service.js';

class RolesController extends ControllerBase {
	async findAll() {
		const filters = this.getQueryFilters();
		const data = await RolesService.getAllRoles(filters);
		return this.success(data, 'Roles recuperados exitosamente.');
	}

	async findById() {
		const { id } = this.getParams();
		const data = await RolesService.getRoleById(Number(id));
		return this.success(data, 'Rol recuperado exitosamente.');
	}

	async create() {
		const data = await RolesService.createRole(this.getBody());
		return this.success(data, 'Rol creado exitosamente.');
	}

	async update() {
		const { id } = this.getParams();
		const data = await RolesService.updateRole(Number(id), this.getBody());
		return this.success(data, 'Rol actualizado exitosamente.');
	}

	async remove() {
		const { id } = this.getParams();
		await RolesService.deleteRole(Number(id));
		return this.success(null, 'Rol eliminado correctamente.');
	}

	async assignPermissions() {
		const { id } = this.getParams();
		await RolesService.assignPermissions(Number(id), this.getBody());
		return this.success(null, 'Permisos asignados al rol correctamente.');
	}

	async removePermissions() {
		const { id } = this.getParams();
		await RolesService.removePermissions(Number(id), this.getBody());
		return this.success(null, 'Permisos removidos del rol correctamente.');
	}
}

export default new RolesController();
