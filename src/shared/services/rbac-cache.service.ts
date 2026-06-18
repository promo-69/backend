import { Database } from '@database/index.js';
import { CacheDatabaseProvider } from '@providers/cache-database.provider.js';
import { ExceptionPermissions } from '@rules/permission-exceptions.type.js';

class RbacCacheService {
	private get _users() {
		return Database.repository('main', 'users') as any;
	}
	private get _permisos() {
		return Database.repository('main', 'permissions') as any;
	}
	private get _roles() {
		return Database.repository('main', 'roles') as any;
	}

	private get _cacheClient() {
		return CacheDatabaseProvider.getInstance().client;
	}

	private get _roleInheritances() {
		return Database.repository('main', 'role-inheritances') as any;
	}

	/**
	 * Obtiene los permisos combinados de un empleado de manera dinámica.
	 * Utiliza los permisos cacheados del rol y las excepciones granulares cacheadas del usuario,
	 * cruzándolas en memoria en cada request sin guardar en caché el resultado combinado final.
	 */
	async getSessionPermissions(userId: number, roleCode: string): Promise<string[]> {
		const rolePerms = await this.getRolePermissions(roleCode);
		const granularPerms = await this.getGranularPermissions(userId);

		const finalPerms = new Set<string>(rolePerms);

		// Eliminar permisos revocados explícitamente
		granularPerms.revoked.forEach((p) => finalPerms.delete(p));

		// Añadir permisos concedidos explícitamente
		granularPerms.granted.forEach((p) => finalPerms.add(p));

		return Array.from(finalPerms);
	}

	/**
	 * Obtiene únicamente los permisos asociados a un rol (y sus heredados)
	 */
	async getRolePermissions(roleCode: string): Promise<string[]> {
		const cacheKey = `rbac:role:${roleCode}:permissions`;
		const cached = await this._cacheClient.get(cacheKey);
		if (cached) return JSON.parse(cached);

		const foundRole = await this._roles.getOne({ code: roleCode });
		if (!foundRole) return [];

		// Obtener herencias (roles padre) de este rol
		const roleInheritances = await this._roleInheritances.getAll({ count: false }, { child_role: foundRole.id });
		const inheritedRoles = Array.isArray(roleInheritances) 
			? roleInheritances.map((ri: any) => ri.parent_role) 
			: (roleInheritances as any).rows?.map((ri: any) => ri.parent_role) || [];

		const rolesToQuery = [foundRole.id, ...inheritedRoles];

		// Asumimos que _permisos.getByRolesWithExceptions puede traer los permisos base sin excepciones
		const permissions = await this._permisos.getByRolesWithExceptions({
			roles: rolesToQuery,
			exceptions: { granted: [], revoked: [] },
		});

		const parsedPermissions = this.parsePermissions(permissions);

		await this._cacheClient.set(cacheKey, JSON.stringify(parsedPermissions), 'EX', 3600);
		return parsedPermissions;
	}

	/**
	 * Obtiene los permisos granulados (excepciones) de un usuario en formato string.
	 * Guarda el resultado en caché.
	 */
	async getGranularPermissions(userId: number): Promise<{ granted: string[]; revoked: string[] }> {
		const cacheKey = `rbac:user:${userId}:granular_permissions`;
		const cached = await this._cacheClient.get(cacheKey);
		if (cached) return JSON.parse(cached);

		const foundUser = await this._users.getFull(userId);
		if (!foundUser || !foundUser._UserPermissions || foundUser._UserPermissions.length === 0) {
			const empty = { granted: [], revoked: [] };
			await this._cacheClient.set(cacheKey, JSON.stringify(empty), 'EX', 3600);
			return empty;
		}

		// Extraemos los IDs de los permisos
		const permissionIds = foundUser._UserPermissions.map((up: any) => up.permission);

		// Obtenemos los códigos TYPE, ACTION, RESOURCE desde la base de datos
		const permissionsFull = await this._permisos.getAllFull({ count: false }, { id: permissionIds });
		const permsArray = Array.isArray(permissionsFull) ? permissionsFull : (permissionsFull as any).rows || [];

		const permMap = new Map<number, string>();
		permsArray.forEach((p: any) => {
			if (p._PermissionTypes && p._Actions && p._Resources) {
				permMap.set(p.id, `${p._PermissionTypes.code}:${p._Actions.code}:${p._Resources.code}`);
			}
		});

		const granted: string[] = [];
		const revoked: string[] = [];

		foundUser._UserPermissions.forEach((up: any) => {
			const strCode = permMap.get(up.permission);
			if (strCode) {
				if (up.is_granted) granted.push(strCode);
				else revoked.push(strCode);
			}
		});

		const result = { granted, revoked };
		await this._cacheClient.set(cacheKey, JSON.stringify(result), 'EX', 3600);
		return result;
	}

	/**
	 * Invalida todos los permisos granulados cacheados para un usuario
	 */
	async invalidateUser(userId: number): Promise<void> {
		const cacheKey = `rbac:user:${userId}:granular_permissions`;
		await this._cacheClient.del(cacheKey);
	}

	/**
	 * Invalida la caché del rol.
	 */
	async invalidateRole(roleCode: string): Promise<void> {
		await this._cacheClient.del(`rbac:role:${roleCode}:permissions`);
	}

	/**
	 * Parsea el array de permisos en crudo (desde DB) hacia el formato TYPE:ACTION:RESOURCE
	 */
	public parsePermissions(permissions: any[]): string[] {
		const uniquePerms = new Set<string>();
		// Extraer directamente del array
		const permsArray = Array.isArray(permissions) ? permissions : (permissions as any).rows || [];
		
		permsArray.forEach((p: any) => {
			if (p._PermissionTypes && p._Actions && p._Resources) {
				uniquePerms.add(`${p._PermissionTypes.code}:${p._Actions.code}:${p._Resources.code}`);
			}
		});
		return Array.from(uniquePerms);
	}
}

export default new RbacCacheService();
