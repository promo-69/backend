'use strict';

/** @type {import('sequelize-cli').Migration} */

module.exports = {
	async up(queryInterface) {
		await queryInterface.sequelize.transaction(async (transaction) => {
			// ── 1. Estados del ciclo de vida ──────────────────────────────
			await queryInterface.bulkInsert(
				'rental_request_statuses',
				[
					{ id: 1, description: 'Pendiente de Revisión' },
					{ id: 2, description: 'Pendiente de Pago' },
					{ id: 3, description: 'Pagada' },
					{ id: 4, description: 'Rechazada' },
					{ id: 5, description: 'Cancelada' },
				],
				{ ignoreDuplicates: true, transaction },
			);

			// --- MÓDULO 5: SOLICITUDES DE ALQUILER PRIVADO (RENTALS) ---
			await queryInterface.bulkInsert(
				'rental_requests',
				[
					// Caso 1: Solicitud pendiente sin precio ni moneda (según regla descrita)
					{
						id: 1,
						customer: 1,
						order: null,
						booking: null,
						room: 1,
						event_type: 3, // Alquiler Privado
						requested_start_time: '2026-06-01 10:00:00',
						requested_end_time: '2026-06-01 14:00:00',
						event_name: 'Cumpleaños de María',
						event_description: 'Celebración privada con amigos y familiares',
						status: 1, // Pendiente
						event_date: '2026-06-01',
						currency: null,
						price: null,
					},
					// Caso 2: Solicitud aceptada y pagada (asociada a Orden 1 y Reserva 3)
					{
						id: 2,
						customer: 1,
						order: 1, // Orden de Pago 1
						booking: 3, // Reserva física en sala 2
						room: 2,
						event_type: 3, // Alquiler Privado
						requested_start_time: '2026-06-02 14:00:00',
						requested_end_time: '2026-06-02 18:00:00',
						event_name: 'Conferencia Tech',
						event_description: 'Presentación corporativa de tecnología',
						event_date: '2026-06-02',
						status: 2, // Aceptada / Completada
						currency: 1, // USD
						price: 150.0, // Precio asignado por el administrador por el espacio
					},
				],
				{ transaction },
			);

			await queryInterface.bulkInsert(
				'rental_catering',
				[
					{
						id: 1,
						rental_request: 2,
						line_type: 1, // Producto
						product: 1, // Cotufas Grandes
						combo: null,
						quantity: 10,
						original_unit_price: 5.0,
						unit_price: 5.0,
						quoted_exchange_rate: 1,
					},
					{
						id: 2,
						rental_request: 2,
						line_type: 1, // Producto
						product: 2, // Refresco Mediano
						combo: null,
						quantity: 20,
						original_unit_price: 2.5,
						unit_price: 2.5,
						quoted_exchange_rate: 1,
					},
				],
				{ transaction },
			);

			// ── 2. Recursos del módulo rentals ────────────────────────────
			await queryInterface.bulkInsert(
				'resources',
				[
					{ code: 'RENTALS', description: 'Solicitudes de alquiler (backoffice)' },
					{ code: 'RENTALS-MY', description: 'Mis solicitudes de alquiler (cliente)' },
				],
				{ ignoreDuplicates: true, transaction },
			);

			// ── 3. Construir permisos a partir de los IDs reales ──────────
			const [actionRows] = await queryInterface.sequelize.query('SELECT id, code FROM actions', { transaction });
			const [resourceRows] = await queryInterface.sequelize.query('SELECT id, code FROM resources', {
				transaction,
			});
			const [typeRows] = await queryInterface.sequelize.query('SELECT id, code FROM permission_types', {
				transaction,
			});

			const aMap = Object.fromEntries(actionRows.map((r) => [r.code, r.id]));
			const rMap = Object.fromEntries(resourceRows.map((r) => [r.code, r.id]));
			const tMap = Object.fromEntries(typeRows.map((r) => [r.code, r.id]));

			// [permission_type_code, action_code, resource_code]
			const permList = [
				['CRUD', 'READ', 'RENTALS'], // Listar/ver solicitudes del propio cine
				['CRUD', 'UPDATE', 'RENTALS'], // Aprobar / rechazar (PATCH /:id/status)
				['VIEW', 'ACCESS', 'RENTALS-MY'], // Cliente: ver sus propias solicitudes
			];

			const permValues = [];
			for (const [t, a, r] of permList) {
				const tid = tMap[t],
					aid = aMap[a],
					rid = rMap[r];
				if (!tid || !aid || !rid) {
					console.warn(`[seed-rentals] Permiso omitido por ID faltante: ${t}:${a}:${r}`);
					continue;
				}
				permValues.push({ permission_type: tid, action: aid, resource: rid });
			}

			if (permValues.length > 0) {
				await queryInterface.bulkInsert('permissions', permValues, { ignoreDuplicates: true, transaction });
			}

			// ── 4. Asignar permisos a roles ───────────────────────────────
			const [roleRows] = await queryInterface.sequelize.query(
				`SELECT id, code FROM roles WHERE code IN ('SUPER_ADMIN', 'CINEMA_MANAGER', 'CUSTOMER')`,
				{ transaction },
			);
			const roleMap = Object.fromEntries(roleRows.map((r) => [r.code, r.id]));

			// Los permisos que acabamos de insertar
			const [newPermRows] = await queryInterface.sequelize.query(
				`SELECT p.id, r.code AS resource_code, a.code AS action_code
                 FROM permissions p
                 JOIN resources r ON p.resource = r.id
                 JOIN actions a   ON p.action   = a.id
                 WHERE r.code IN ('RENTALS', 'RENTALS-MY')`,
				{ transaction },
			);

			const rpValues = [];

			for (const perm of newPermRows) {
				const isManagerPerm = perm.resource_code === 'RENTALS';
				const isCustomerPerm = perm.resource_code === 'RENTALS-MY';

				// CINEMA_MANAGER recibe permisos de backoffice de rentals
				if (isManagerPerm && roleMap['CINEMA_MANAGER']) {
					rpValues.push({ role: roleMap['CINEMA_MANAGER'], permission: perm.id });
				}
				// SUPER_ADMIN recibe todos los permisos
				if (roleMap['SUPER_ADMIN']) {
					rpValues.push({ role: roleMap['SUPER_ADMIN'], permission: perm.id });
				}
				// CUSTOMER recibe solo el permiso de ver sus propias solicitudes
				if (isCustomerPerm && roleMap['CUSTOMER']) {
					rpValues.push({ role: roleMap['CUSTOMER'], permission: perm.id });
				}
			}

			if (rpValues.length > 0) {
				await queryInterface.bulkInsert('role_permissions', rpValues, { ignoreDuplicates: true, transaction });
			}
		});
	},

	async down(queryInterface) {
		await queryInterface.sequelize.transaction(async (transaction) => {
			await queryInterface.bulkDelete('rental_catering', null, {});
			await queryInterface.bulkDelete('rental_requests', null, {});
			// Eliminar role_permissions de los permisos de RENTALS
			await queryInterface.sequelize.query(
				`DELETE FROM role_permissions
                 WHERE permission IN (
                   SELECT p.id FROM permissions p
                   JOIN resources r ON p.resource = r.id
                   WHERE r.code IN ('RENTALS', 'RENTALS-MY')
                 )`,
				{ transaction },
			);
			// Eliminar permissions
			await queryInterface.sequelize.query(
				`DELETE FROM permissions
                 WHERE resource IN (SELECT id FROM resources WHERE code IN ('RENTALS', 'RENTALS-MY'))`,
				{ transaction },
			);
			// Eliminar recursos
			await queryInterface.bulkDelete('resources', { code: ['RENTALS', 'RENTALS-MY'] }, { transaction });
			// Eliminar estados de solicitud (solo si no tienen referencias activas)
			await queryInterface.bulkDelete('rental_request_statuses', null, { transaction });
		});
	},
};
