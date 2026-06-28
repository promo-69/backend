'use strict';

module.exports = {
	async up(queryInterface) {
		await queryInterface.sequelize.transaction(async (transaction) => {
			// ------------------------------------------------------------------
			// 1. ACCIONES — extender el catálogo del seeder core con IDs fijos.
			//    Las acciones existentes (id 1-6) ya las maneja el seeder core;
			//    usamos ignoreDuplicates como seguridad pero con ID explícito
			//    para que sean idempotentes en cualquier entorno.
			// ------------------------------------------------------------------
			await queryInterface.bulkInsert(
				'actions',
				[
					// id 7-8: extensiones del catálogo core
					{ id: 7, code: 'CHANGE', description: 'Cambiar o reasignar un atributo específico' },
					{ id: 8, code: 'MANAGE', description: 'Gestión compuesta (múltiples sub-operaciones)' },
				],
				{ ignoreDuplicates: true, transaction },
			);

			// ------------------------------------------------------------------
			// 2. RECURSOS
			//    MOVIES (id:1) ya existe desde el seeder core; ignoreDuplicates
			//    garantiza que no rompa si se re-ejecuta.
			// ------------------------------------------------------------------
			await queryInterface.bulkInsert(
				'resources',
				[
					// Backoffice
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
					{ code: 'CINEMAS-SHOWTIMES', description: 'Funciones de todas las sucursales (backoffice)' },
					{ code: 'PRODUCTS', description: 'Productos de confitería' },
					{ code: 'COMBOS', description: 'Combos' },
					{ code: 'COMBOS_ITEMS', description: 'Ítems de combos' },
					{ code: 'INVENTORY', description: 'Inventario' },
					{ code: 'INVENTORY_MOVEMENT', description: 'Movimiento de inventario' },
					{ code: 'ROOMS', description: 'Salas' },
					{ code: 'SEATS', description: 'Asientos' },
					{ code: 'ROOM-EVENTS', description: 'Eventos alternativos' },
					{ code: 'SHOWTIMES', description: 'Funciones (backoffice)' },
					{ code: 'EXCHANGE-RATES', description: 'Tipos de cambio' },
					{ code: 'PRICE-MODIFIERS', description: 'Reglas de precios' },
					{ code: 'DASHBOARD', description: 'Tablero principal' },
					{ code: 'CATALOGS', description: 'Catálogos' },
					{ code: 'LOYALTY', description: 'Lealtad' },
					{ code: 'BOOKING', description: 'Reservas' },
					{ code: 'REPORTS', description: 'Reportes' },
					{ code: 'INVOICES', description: 'Facturas' },
					{ code: 'FINANCES', description: 'Finanzas' },
					{ code: 'POS', description: 'Punto de venta' },
					{ code: 'CASHIER_DASHBOARD', description: 'Tablero de cajero' },
					{ code: 'CONCESSIONS', description: 'Confitería' },
				],
				{ ignoreDuplicates: true, transaction },
			);

			// ------------------------------------------------------------------
			// 3. Cargar IDs desde la BD para construir los permisos
			//    (la lista de acciones y tipos ya los tiene el seeder core con
			//    IDs fijos, pero los recursos se insertaron sin ID explícito)
			// ------------------------------------------------------------------
			const [actionRows] = await queryInterface.sequelize.query('SELECT id, code FROM actions', { transaction });
			const [resourceRows] = await queryInterface.sequelize.query('SELECT id, code FROM resources', {
				transaction,
			});
			const [typeRows] = await queryInterface.sequelize.query('SELECT id, code FROM permission_types', {
				transaction,
			});

			const actionMap = Object.fromEntries(actionRows.map((r) => [r.code, r.id]));
			const resourceMap = Object.fromEntries(resourceRows.map((r) => [r.code, r.id]));
			const typeMap = Object.fromEntries(typeRows.map((r) => [r.code, r.id]));

			// Validar que los tipos base existen
			const missingTypes = ['VIEW', 'CRUD', 'FEAT'].filter((c) => !typeMap[c]);
			if (missingTypes.length > 0) {
				throw new Error(
					`Faltan permission_types en la BD: ${missingTypes.join(', ')}. ` +
						'Ejecutá primero el seeder core (20260325061126-seed-core-catalogs).',
				);
			}

			// ------------------------------------------------------------------
			// 4. LISTA DE PERMISOS
			//    Formato: [tipo, acción, recurso]
			//    Tipos válidos: VIEW | CRUD | FEAT  (definidos en seeder core)
			//    Acciones válidas: CREATE | READ | UPDATE | DELETE | DO | ACCESS | CHANGE | MANAGE
			// ------------------------------------------------------------------
			const permissionList = [
				// Movies (MOVIES id:1 ya existe en core, faltan READ y CREATE)
				['CRUD', 'READ', 'MOVIES'],
				['CRUD', 'CREATE', 'MOVIES'],
				['CRUD', 'UPDATE', 'MOVIES'], // ya existía en core seeder (id:1)
				['CRUD', 'DELETE', 'MOVIES'], // ya existía en core seeder (id:2)

				// Employees
				['CRUD', 'READ', 'EMPLOYEES'],
				['CRUD', 'CREATE', 'EMPLOYEES'],
				['CRUD', 'UPDATE', 'EMPLOYEES'],
				['CRUD', 'DELETE', 'EMPLOYEES'],
				['FEAT', 'CHANGE', 'EMPLOYEES_POSITION'], // acción CHANGE (id:7) — antes fallaba

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
				['CRUD', 'CREATE', 'CINEMAS-INVENTORY'],
				['CRUD', 'READ', 'CINEMAS-ROOM-EVENTS'],
				['CRUD', 'CREATE', 'CINEMAS-ROOM-EVENTS'],
				['CRUD', 'READ', 'CINEMAS-SHOWTIMES'], // recurso nuevo
				['CRUD', 'CREATE', 'CINEMAS-SHOWTIMES'], // recurso nuevo

				// Concessions
				['CRUD', 'READ', 'PRODUCTS'],
				['CRUD', 'CREATE', 'PRODUCTS'],
				['CRUD', 'UPDATE', 'PRODUCTS'],
				['CRUD', 'DELETE', 'PRODUCTS'],
				['CRUD', 'READ', 'COMBOS'],
				['CRUD', 'CREATE', 'COMBOS'],
				['CRUD', 'UPDATE', 'COMBOS'],
				['CRUD', 'DELETE', 'COMBOS'],
				['FEAT', 'MANAGE', 'COMBOS_ITEMS'], // acción MANAGE (id:8) — antes fallaba

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

				// Showtimes (backoffice)
				['CRUD', 'READ', 'SHOWTIMES'], // recurso nuevo
				['CRUD', 'CREATE', 'SHOWTIMES'], // recurso nuevo
				['CRUD', 'UPDATE', 'SHOWTIMES'], // recurso nuevo
				['CRUD', 'DELETE', 'SHOWTIMES'], // recurso nuevo

				// Exchange Rates
				['CRUD', 'READ', 'EXCHANGE-RATES'],
				['CRUD', 'CREATE', 'EXCHANGE-RATES'],
				['CRUD', 'DELETE', 'EXCHANGE-RATES'],

				// Price Modifiers
				['CRUD', 'READ', 'PRICE-MODIFIERS'],
				['CRUD', 'CREATE', 'PRICE-MODIFIERS'],
				['CRUD', 'UPDATE', 'PRICE-MODIFIERS'],
				['CRUD', 'DELETE', 'PRICE-MODIFIERS'],

				// Dashboard and general access resources
				['VIEW', 'ACCESS', 'DASHBOARD'],
				['VIEW', 'ACCESS', 'CINEMAS'],
				['VIEW', 'ACCESS', 'EMPLOYEES'],
				['VIEW', 'ACCESS', 'SHOWTIMES'],
				['VIEW', 'ACCESS', 'INVENTORY'],
				['VIEW', 'ACCESS', 'CATALOGS'],
				['VIEW', 'ACCESS', 'LOYALTY'],
				['VIEW', 'ACCESS', 'BOOKING'],
				['VIEW', 'ACCESS', 'REPORTS'],
				['VIEW', 'ACCESS', 'INVOICES'],
				['VIEW', 'ACCESS', 'FINANCES'],
				['VIEW', 'ACCESS', 'POS'],
				['VIEW', 'ACCESS', 'CASHIER_DASHBOARD'],
				['VIEW', 'ACCESS', 'CONCESSIONS'],
			];

			// Construir filas de permisos validando que todos los IDs existen
			const permissionValues = [];
			const skipped = [];
			for (const [typeCode, actionCode, resourceCode] of permissionList) {
				const typeId = typeMap[typeCode];
				const actionId = actionMap[actionCode];
				const resourceId = resourceMap[resourceCode];
				if (!typeId || !actionId || !resourceId) {
					skipped.push(`${typeCode}:${actionCode}:${resourceCode}`);
					continue;
				}
				permissionValues.push({ permission_type: typeId, action: actionId, resource: resourceId });
			}

			if (skipped.length > 0) {
				console.warn('[seed-permissions] Permisos omitidos por IDs faltantes:', skipped);
			}

			if (permissionValues.length > 0) {
				await queryInterface.bulkInsert('permissions', permissionValues, {
					ignoreDuplicates: true,
					transaction,
				});
			}

			// ------------------------------------------------------------------
			// 5. Asignar todos los permisos de este seeder al rol SUPER_ADMIN
			// ------------------------------------------------------------------
			const [roleRows] = await queryInterface.sequelize.query(`SELECT id FROM roles WHERE code = 'SUPER_ADMIN'`, {
				transaction,
			});
			if (roleRows.length > 0) {
				const adminRoleId = roleRows[0].id;

				const resourceCodes = [
					'MOVIES',
					'EMPLOYEES',
					'EMPLOYEES_POSITION',
					'CUSTOMERS',
					'POINTS-ADJUSTMENT',
					'CINEMAS',
					'CINEMAS-EMPLOYEES',
					'CINEMAS-COMBOS',
					'CINEMAS-ROOMS',
					'CINEMAS-INVENTORY',
					'CINEMAS-ROOM-EVENTS',
					'CINEMAS-SHOWTIMES',
					'PRODUCTS',
					'COMBOS',
					'COMBOS_ITEMS',
					'INVENTORY',
					'INVENTORY_MOVEMENT',
					'ROOMS',
					'SEATS',
					'ROOM-EVENTS',
					'SHOWTIMES',
					'EXCHANGE-RATES',
					'PRICE-MODIFIERS',
					'DASHBOARD',
					'CATALOGS',
					'LOYALTY',
					'BOOKING',
					'REPORTS',
					'INVOICES',
					'FINANCES',
					'POS',
					'CASHIER_DASHBOARD',
					'CONCESSIONS',
				];
				const inClause = resourceCodes.map((c) => `'${c}'`).join(',');

				const [permRows] = await queryInterface.sequelize.query(
					`SELECT p.id
					 FROM permissions p
					 JOIN resources r ON p.resource = r.id
					 WHERE r.code IN (${inClause})`,
					{ transaction },
				);

				const rolePermValues = permRows.map((p) => ({ role: adminRoleId, permission: p.id }));
				if (rolePermValues.length > 0) {
					await queryInterface.bulkInsert('role_permissions', rolePermValues, {
						ignoreDuplicates: true,
						transaction,
					});
				}
			}

			// ------------------------------------------------------------------
			// 6. Asignar permisos específicos a GENERAL_MANAGER y CINEMA_MANAGER
			// ------------------------------------------------------------------
			const [gmRoleRows] = await queryInterface.sequelize.query(
				`SELECT id FROM roles WHERE code = 'GENERAL_MANAGER'`,
				{ transaction },
			);
			const [cmRoleRows] = await queryInterface.sequelize.query(
				`SELECT id FROM roles WHERE code = 'CINEMA_MANAGER'`,
				{ transaction },
			);

			if (gmRoleRows.length > 0) {
				const gmRoleId = gmRoleRows[0].id;
				const gmResourceCodes = ['PRODUCTS', 'CINEMAS-COMBOS'];
				const inClause = gmResourceCodes.map((c) => `'${c}'`).join(',');
				const [permRows] = await queryInterface.sequelize.query(
					`SELECT p.id FROM permissions p JOIN resources r ON p.resource = r.id WHERE r.code IN (${inClause})`,
					{ transaction },
				);
				const rolePermValues = permRows.map((p) => ({ role: gmRoleId, permission: p.id }));
				if (rolePermValues.length > 0) {
					await queryInterface.bulkInsert('role_permissions', rolePermValues, {
						ignoreDuplicates: true,
						transaction,
					});
				}
			}

			if (cmRoleRows.length > 0) {
				const cmRoleId = cmRoleRows[0].id;
				const cmResourceCodes = ['COMBOS', 'COMBOS_ITEMS'];
				const inClause = cmResourceCodes.map((c) => `'${c}'`).join(',');
				const [permRows] = await queryInterface.sequelize.query(
					`SELECT p.id FROM permissions p JOIN resources r ON p.resource = r.id WHERE r.code IN (${inClause})`,
					{ transaction },
				);
				const rolePermValues = permRows.map((p) => ({ role: cmRoleId, permission: p.id }));
				if (rolePermValues.length > 0) {
					await queryInterface.bulkInsert('role_permissions', rolePermValues, {
						ignoreDuplicates: true,
						transaction,
					});
				}
			}
		});
	},

	async down(queryInterface) {
		await queryInterface.sequelize.transaction(async (transaction) => {
			// Eliminar solo lo que este seeder insertó (no tocar el seeder core)
			const newActionCodes = ['CHANGE', 'MANAGE'];
			const newResourceCodes = [
				'EMPLOYEES',
				'EMPLOYEES_POSITION',
				'CUSTOMERS',
				'POINTS-ADJUSTMENT',
				'CINEMAS',
				'CINEMAS-EMPLOYEES',
				'CINEMAS-COMBOS',
				'CINEMAS-ROOMS',
				'CINEMAS-INVENTORY',
				'CINEMAS-ROOM-EVENTS',
				'CINEMAS-SHOWTIMES',
				'PRODUCTS',
				'COMBOS',
				'COMBOS_ITEMS',
				'INVENTORY',
				'INVENTORY_MOVEMENT',
				'ROOMS',
				'SEATS',
				'ROOM-EVENTS',
				'SHOWTIMES',
				'EXCHANGE-RATES',
				'PRICE-MODIFIERS',
				'DASHBOARD',
				'CATALOGS',
				'LOYALTY',
				'BOOKING',
				'REPORTS',
				'INVOICES',
				'FINANCES',
				'POS',
				'CASHIER_DASHBOARD',
				'CONCESSIONS',
			];

			// Eliminar role_permissions asociados
			await queryInterface.sequelize.query(
				`DELETE FROM role_permissions
				 WHERE permission IN (
				   SELECT p.id FROM permissions p
				   JOIN resources r ON p.resource = r.id
				   WHERE r.code IN (${newResourceCodes.map((c) => `'${c}'`).join(',')})
				 )`,
				{ transaction },
			);

			// Eliminar permisos de recursos de este seeder
			await queryInterface.sequelize.query(
				`DELETE FROM permissions
				 WHERE resource IN (
				   SELECT id FROM resources
				   WHERE code IN (${newResourceCodes.map((c) => `'${c}'`).join(',')})
				 )`,
				{ transaction },
			);

			// Eliminar recursos de este seeder
			await queryInterface.bulkDelete('resources', { code: newResourceCodes }, { transaction });

			// Eliminar acciones nuevas (CHANGE, MANAGE)
			await queryInterface.bulkDelete('actions', { code: newActionCodes }, { transaction });
		});
	},
};
