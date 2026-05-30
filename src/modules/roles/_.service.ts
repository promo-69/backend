import { BaseService } from '@bases/service.base.js';
import { Database } from '@database/index.js';
import { ValidationError, NotFoundError } from '@errors';

interface RolePermissionPayload {
	permissions?: number[];
	permissionIds?: number[];
}

class RolesService extends BaseService {
	constructor() {
		super();
	}

	private get _roles() {
		return Database.repository('main', 'roles') as any;
	}

	private get _permissions() {
		return Database.repository('main', 'permissions') as any;
	}

	private get _rolePermissions() {
		return Database.repository('main', 'role-permissions') as any;
	}

	async getAllRoles(filters?: any) {
		return this._roles.getAllFull(filters);
	}

	async getRoleById(id: number) {
		const role = await this._roles.getById(id);
		if (!role) throw new NotFoundError('Rol', id.toString());
		return role;
	}

	async createRole(body: Record<string, any>) {
		this.validateRequired(body, ['code', 'name', 'description']);

		const payload = {
			code: body.code,
			name: body.name,
			description: body.description,
		};

		return this._roles.create(payload);
	}

	async updateRole(id: number, body: Record<string, any>) {
		const updateData = this.sanitizeData(body, ['code', 'name', 'description']);

		if (Object.keys(updateData).length === 0)
			throw new ValidationError('No se enviaron datos válidos para actualizar.', []);

		const role = await this._roles.getById(id);
		if (!role) throw new NotFoundError('Rol', id.toString());

		await this._roles.update(id, updateData);
		return this.getRoleById(id);
	}

	async deleteRole(id: number) {
		const role = await this._roles.getById(id);
		if (!role) throw new NotFoundError('Rol', id.toString());

		await this._roles.delete(id);
	}

	private getPermissionIds(payload: RolePermissionPayload) {
		const permissions = Array.isArray(payload.permissions)
			? payload.permissions
			: Array.isArray(payload.permissionIds)
				? payload.permissionIds
				: [];

		return Array.from(new Set(permissions.map((permission) => Number(permission)).filter(Number.isInteger)));
	}

	private async validateRoleExists(roleId: number) {
		const role = await this._roles.getById(roleId);
		if (!role) throw new NotFoundError('Rol', roleId.toString());
	}

	private async validatePermissionsExist(permissionIds: number[]) {
		const permissions = await this._permissions.getAll({ count: false }, { id: permissionIds });
		const existingIds = Array.isArray(permissions) ? permissions.map((permission: any) => permission.id) : [];

		const missingIds = permissionIds.filter((id) => !existingIds.includes(id));
		if (missingIds.length > 0)
			throw new ValidationError('Algunos permisos no existen: ' + missingIds.join(', '), missingIds.map(String));
	}

	async assignPermissions(roleId: number, body: RolePermissionPayload) {
		const permissionIds = this.getPermissionIds(body);
		if (permissionIds.length === 0) throw new ValidationError('Debes enviar al menos un permiso válido.', []);

		await this.validateRoleExists(roleId);
		await this.validatePermissionsExist(permissionIds);

		await this._rolePermissions.transaction(async (transaction: any) => {
			await this._rolePermissions.bulkCreate(
				permissionIds.map((permissionId) => ({ role: roleId, permission: permissionId })),
				{ ignoreDuplicates: true, ignoreFields: ['role', 'permission'], transaction },
			);
		});
	}

	async removePermissions(roleId: number, body: RolePermissionPayload) {
		const permissionIds = this.getPermissionIds(body);
		if (permissionIds.length === 0) throw new ValidationError('Debes enviar al menos un permiso válido.', []);

		await this.validateRoleExists(roleId);

		await this._rolePermissions.transaction(async (transaction: any) => {
			await this._rolePermissions.delete({ role: roleId, permission: permissionIds }, { transaction });
		});
	}
}

export default new RolesService();
