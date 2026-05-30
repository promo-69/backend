'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
	async up(queryInterface, Sequelize) {
		// 1. Acciones
		const actions = [
			{ code: 'READ', description: 'Lectura' },
			{ code: 'CREATE', description: 'Creación' },
			{ code: 'UPDATE', description: 'Actualización' },
			{ code: 'DELETE', description: 'Eliminación' },
			{ code: 'CHANGE', description: 'Cambiar' },
			{ code: 'DO', description: 'Ejecutar funcionalidad' },
			{ code: 'MANAGE', description: 'Gestionar' },
		];
		await queryInterface.bulkInsert('actions', actions, { ignoreDuplicates: true });

		// 2. Recursos
		const resources = [
			{ code: 'EMPLOYEES', description: 'Empleados' },
			{ code: 'EMPLOYEES_POSITION', description: 'Posición de empleados' },
			{ code: 'CUSTOMERS', description: 'Clientes' },
			{ code: 'POINTS-ADJUSTMENT', description: 'Ajuste de puntos de lealtad' },
			{ code: 'CINEMAS', description: 'Gestión de Cines' },
			{ code: 'CINEMAS-EMPLOYEES', description: 'Empleados de todas las sucursales' },
			{ code: 'CINEMAS-COMBOS', description: 'Combos de todas las sucursales' },
			{ code: 'CINEMAS-ROOMS', description: 'Salas de todas las sucursales' },
			{ code: 'CINEMAS-INVENTORY', description: 'Inventario de todas las sucursales' },
			{ code: 'CINEMAS-ROOM-EVENTS', description: 'Eventos alternativos de todas las sucursales' },
			{ code: 'PRODUCTS', description: 'Productos de confitería' },
			{ code: 'COMBOS', description: 'Combos' },
			{ code: 'COMBOS_ITEMS', description: 'Ítems de combos' },
			{ code: 'INVENTORY', description: 'Inventario' },
			{ code: 'INVENTORY_MOVEMENT', description: 'Movimiento de inventario' },
			{ code: 'ROOMS', description: 'Salas' },
			{ code: 'SEATS', description: 'Asientos' },
			{ code: 'ROOM-EVENTS', description: 'Eventos alternativos' },
			{ code: 'EXCHANGE-RATES', description: 'Tipos de cambio' },
			{ code: 'PRICE-MODIFIERS', description: 'Reglas de precios' },
			{ code: 'ROLES', description: 'Roles del sistema' },
			{ code: 'PERMISSIONS', description: 'Gestión de permisos' },
		];
		await queryInterface.bulkInsert('resources', resources, { ignoreDuplicates: true });

		// 3. Tipos de permiso
		const permissionTypes = [
			{ code: 'CRUD', description: 'Permiso estándar CRUD' },
			{ code: 'FEAT', description: 'Funcionalidad especial' },
			{ code: 'TOTAL', description: 'Acceso total' },
		];
		await queryInterface.bulkInsert('permission_types', permissionTypes, { ignoreDuplicates: true });

		// 4. Permisos
		// Objeto para mapear string → id
		const actionMap = {};
		const resourceMap = {};
		const typeMap = {};

		// Cargar los IDs desde la BD (por si ya existen)
		const [actionRows] = await queryInterface.sequelize.query(`SELECT id, code FROM actions`);
		const [resourceRows] = await queryInterface.sequelize.query(`SELECT id, code FROM resources`);
		const [typeRows] = await queryInterface.sequelize.query(`SELECT id, code FROM permission_types`);

		actionRows.forEach((r) => (actionMap[r.code] = r.id));
		resourceRows.forEach((r) => (resourceMap[r.code] = r.id));
		typeRows.forEach((r) => (typeMap[r.code] = r.id));

		// Lista de permisos (tipo, acción, recurso)
		const permissionList = [
			// Employees
			['CRUD', 'READ', 'EMPLOYEES'],
			['CRUD', 'CREATE', 'EMPLOYEES'],
			['CRUD', 'UPDATE', 'EMPLOYEES'],
			['CRUD', 'DELETE', 'EMPLOYEES'],
			['FEAT', 'CHANGE', 'EMPLOYEES_POSITION'],

			// Customers
			['CRUD', 'READ', 'CUSTOMERS'],
			['CRUD', 'CREATE', 'CUSTOMERS'],
			['CRUD', 'UPDATE', 'CUSTOMERS'],
			['CRUD', 'DELETE', 'CUSTOMERS'],
			['FEAT', 'DO', 'POINTS-ADJUSTMENT'],

			// Cinemas
			['CRUD', 'CREATE', 'CINEMAS'],
			['CRUD', 'UPDATE', 'CINEMAS'],
			['CRUD', 'DELETE', 'CINEMAS'],
			['CRUD', 'READ', 'CINEMAS-EMPLOYEES'],
			['CRUD', 'READ', 'CINEMAS-COMBOS'],
			['CRUD', 'CREATE', 'CINEMAS-COMBOS'],
			['CRUD', 'READ', 'CINEMAS-ROOMS'],
			['CRUD', 'READ', 'CINEMAS-INVENTORY'],
			['CRUD', 'READ', 'CINEMAS-ROOM-EVENTS'],
			['CRUD', 'CREATE', 'CINEMAS-ROOM-EVENTS'],

			// Concessions
			['CRUD', 'READ', 'PRODUCTS'],
			['CRUD', 'CREATE', 'PRODUCTS'],
			['CRUD', 'UPDATE', 'PRODUCTS'],
			['CRUD', 'DELETE', 'PRODUCTS'],
			['CRUD', 'READ', 'COMBOS'],
			['CRUD', 'CREATE', 'COMBOS'],
			['CRUD', 'UPDATE', 'COMBOS'],
			['CRUD', 'DELETE', 'COMBOS'],
			['FEAT', 'MANAGE', 'COMBOS_ITEMS'],

			// Inventory
			['CRUD', 'READ', 'INVENTORY'],
			['CRUD', 'CREATE', 'INVENTORY_MOVEMENT'],

			// Rooms
			['CRUD', 'READ', 'ROOMS'],
			['CRUD', 'CREATE', 'ROOMS'],
			['CRUD', 'UPDATE', 'ROOMS'],
			['CRUD', 'DELETE', 'ROOMS'],

			// Seats
			['CRUD', 'READ', 'SEATS'],
			['CRUD', 'CREATE', 'SEATS'],
			['CRUD', 'UPDATE', 'SEATS'],
			['CRUD', 'DELETE', 'SEATS'],

			// Room Events
			['CRUD', 'READ', 'ROOM-EVENTS'],
			['CRUD', 'CREATE', 'ROOM-EVENTS'],
			['CRUD', 'UPDATE', 'ROOM-EVENTS'],
			['CRUD', 'DELETE', 'ROOM-EVENTS'],

			// Exchange Rates
			['CRUD', 'READ', 'EXCHANGE-RATES'],
			['CRUD', 'CREATE', 'EXCHANGE-RATES'],
			['CRUD', 'DELETE', 'EXCHANGE-RATES'],

			// Price Modifiers
			['CRUD', 'READ', 'PRICE-MODIFIERS'],
			['CRUD', 'CREATE', 'PRICE-MODIFIERS'],
			['CRUD', 'UPDATE', 'PRICE-MODIFIERS'],
			['CRUD', 'DELETE', 'PRICE-MODIFIERS'],

			// Roles
			['CRUD', 'READ', 'ROLES'],
			['CRUD', 'CREATE', 'ROLES'],
			['CRUD', 'UPDATE', 'ROLES'],
			['CRUD', 'DELETE', 'ROLES'],
			['CRUD', 'READ', 'PERMISSIONS'],
			['CRUD', 'CREATE', 'PERMISSIONS'],
			['CRUD', 'UPDATE', 'PERMISSIONS'],
			['CRUD', 'DELETE', 'PERMISSIONS'],
		];

		const permissionValues = permissionList
			.map(([typeCode, actionCode, resourceCode]) => {
				const actionId = actionMap[actionCode];
				const resourceId = resourceMap[resourceCode];
				const typeId = typeMap[typeCode];
				if (!actionId || !resourceId || !typeId) return null;
				return { action: actionId, resource: resourceId, permission_type: typeId };
			})
			.filter(Boolean);

		if (permissionValues.length > 0) {
			await queryInterface.bulkInsert('permissions', permissionValues, { ignoreDuplicates: true });
		}

		// 5. Asignar todos los permisos al rol admin
		const [roleRows] = await queryInterface.sequelize.query(`SELECT id FROM roles WHERE code = 'SUPER_ADMIN'`);
		if (roleRows.length > 0) {
			const adminRoleId = roleRows[0].id;

			// Obtener todos los permisos que acabamos de asegurar
			const [permRows] = await queryInterface.sequelize.query(`
        SELECT p.id
        FROM permissions p
        JOIN resources r ON p.resource = r.id
        JOIN permission_types pt ON p.permission_type = pt.id
        WHERE r.code IN (${resources.map((r) => `'${r.code}'`).join(',')})
          AND pt.code IN ('CRUD', 'FEAT')
      `);

			const rolePermValues = permRows.map((p) => ({ role: adminRoleId, permission: p.id }));

			if (rolePermValues.length > 0) {
				await queryInterface.bulkInsert('role_permissions', rolePermValues, { ignoreDuplicates: true });
			}
		}
	},

	async down(queryInterface, Sequelize) {},
};
