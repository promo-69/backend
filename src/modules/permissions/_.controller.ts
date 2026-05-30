import { ControllerBase } from '@bases/controller.base.js';
import PermissionsService from './_.service.js';

class PermissionsController extends ControllerBase {
	async findAll() {
		const filters = this.getQueryFilters();
		const data = await PermissionsService.getAllPermissions(filters);
		return this.success(data, 'Permisos recuperados exitosamente.');
	}

	async findById() {
		const { id } = this.getParams();
		const data = await PermissionsService.getPermissionById(Number(id));
		return this.success(data, 'Permiso recuperado exitosamente.');
	}

	async create() {
		const data = await PermissionsService.createPermission(this.getBody());
		return this.success(data, 'Permiso creado exitosamente.');
	}

	async update() {
		const { id } = this.getParams();
		const data = await PermissionsService.updatePermission(Number(id), this.getBody());
		return this.success(data, 'Permiso actualizado exitosamente.');
	}

	async remove() {
		const { id } = this.getParams();
		await PermissionsService.deletePermission(Number(id));
		return this.success(null, 'Permiso eliminado correctamente.');
	}
}

export default new PermissionsController();
