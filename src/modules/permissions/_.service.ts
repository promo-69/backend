import { BaseService } from '@bases/service.base.js';
import { Database } from '@database/index.js';
import { ValidationError, NotFoundError, DuplicateEntryError } from '@errors';

class PermissionsService extends BaseService {
	private get _permissions() {
		return Database.repository('main', 'permissions') as any;
	}

	private get _actions() {
		return Database.repository('main', 'actions') as any;
	}

	private get _resources() {
		return Database.repository('main', 'resources') as any;
	}

	private get _permissionTypes() {
		return Database.repository('main', 'permission-types') as any;
	}

	async getAllPermissions(filters?: any) {
		return this._permissions.getAllFull(filters);
	}

	async getPermissionById(id: number) {
		const permission = await this._permissions.getFull(id);
		if (!permission) throw new NotFoundError('Permiso', id.toString());
		return permission;
	}

	async createPermission(body: Record<string, any>) {
		this.validateRequired(body, ['action', 'resource', 'permission_type']);

		const payload = {
			action: Number(body.action),
			resource: Number(body.resource),
			permission_type: Number(body.permission_type),
		};

		if (
			!Number.isInteger(payload.action) ||
			!Number.isInteger(payload.resource) ||
			!Number.isInteger(payload.permission_type)
		) {
			throw new ValidationError('action, resource y permission_type deben ser IDs enteros válidos.', []);
		}

		await this.validateForeignKeys(payload);

		// Verificar si ya existe un permiso con la misma combinación
		const existing = await this._permissions.getOne({
			action: payload.action,
			resource: payload.resource,
			permission_type: payload.permission_type,
		});

		if (existing)
			throw new DuplicateEntryError(
				'permiso',
				`${payload.action}-${payload.resource}-${payload.permission_type}`,
			);

		return this._permissions.create(payload);
	}

	async updatePermission(id: number, body: Record<string, any>) {
		const updateData = this.sanitizeData(body, ['action', 'resource', 'permission_type']);

		if (Object.keys(updateData).length === 0)
			throw new ValidationError('No se enviaron datos válidos para actualizar.', []);

		if (updateData.action !== undefined) updateData.action = Number(updateData.action);
		if (updateData.resource !== undefined) updateData.resource = Number(updateData.resource);
		if (updateData.permission_type !== undefined) updateData.permission_type = Number(updateData.permission_type);

		if (
			(updateData.action !== undefined && !Number.isInteger(updateData.action)) ||
			(updateData.resource !== undefined && !Number.isInteger(updateData.resource)) ||
			(updateData.permission_type !== undefined && !Number.isInteger(updateData.permission_type))
		) {
			throw new ValidationError('action, resource y permission_type deben ser IDs enteros válidos.', []);
		}

		const permission = await this._permissions.getById(id);
		if (!permission) throw new NotFoundError('Permiso', id.toString());

		if (Object.keys(updateData).length > 0) await this.validateForeignKeys(updateData);

		await this._permissions.update(id, updateData);
		return this.getPermissionById(id);
	}

	async deletePermission(id: number) {
		const permission = await this._permissions.getById(id);
		if (!permission) throw new NotFoundError('Permiso', id.toString());
		await this._permissions.delete(id);
	}

	private async validateForeignKeys(payload: Record<string, number>) {
		if (payload.action !== undefined) await this.validateRecordExists(this._actions, 'Acción', payload.action);
		if (payload.resource !== undefined)
			await this.validateRecordExists(this._resources, 'Recurso', payload.resource);
		if (payload.permission_type !== undefined)
			await this.validateRecordExists(this._permissionTypes, 'Tipo de permiso', payload.permission_type);
	}

	private async validateRecordExists(repository: any, label: string, id: number) {
		const record = await repository.getById(id);
		if (!record) throw new ValidationError(`${label} no existe: ${id}`, []);
	}
}

export default new PermissionsService();
