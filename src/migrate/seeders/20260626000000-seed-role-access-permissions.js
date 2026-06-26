'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
	async up(queryInterface) {
		await queryInterface.sequelize.transaction(async (transaction) => {
			const [actionRows] = await queryInterface.sequelize.query('SELECT id, code FROM actions', {
				transaction,
			});
			const [resourceRows] = await queryInterface.sequelize.query('SELECT id, code FROM resources', {
				transaction,
			});
			const [typeRows] = await queryInterface.sequelize.query('SELECT id, code FROM permission_types', {
				transaction,
			});
			const [roleRows] = await queryInterface.sequelize.query(
				`SELECT id, code FROM roles WHERE code IN ('SUPER_ADMIN', 'GENERAL_MANAGER', 'CINEMA_MANAGER', 'CASHIER', 'USHER')`,
				{ transaction },
			);

			const actionMap = Object.fromEntries(actionRows.map((r) => [r.code, r.id]));
			const resourceMap = Object.fromEntries(resourceRows.map((r) => [r.code, r.id]));
			const typeMap = Object.fromEntries(typeRows.map((r) => [r.code, r.id]));
			const roleMap = Object.fromEntries(roleRows.map((r) => [r.code, r.id]));

			const missingTypes = ['VIEW'].filter((code) => !typeMap[code]);
			if (missingTypes.length > 0) {
				throw new Error(
					`Faltan permission_types en la BD: ${missingTypes.join(', ')}. Ejecutá primero el seeder core (20260325061126-seed-core-catalogs).`,
				);
			}

			const resourceCodes = [
				'DASHBOARD',
				'CINEMAS',
				'EMPLOYEES',
				'SHOWTIMES',
				'INVENTORY',
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
			const inClause = resourceCodes.map((code) => `'${code}'`).join(',');

			const [permissionRows] = await queryInterface.sequelize.query(
				`SELECT p.id, r.code AS resource_code
                 FROM permissions p
                 JOIN resources r ON p.resource = r.id
                 JOIN actions a ON p.action = a.id
                 JOIN permission_types t ON p.permission_type = t.id
                 WHERE a.code = 'ACCESS' AND t.code = 'VIEW' AND r.code IN (${inClause})`,
				{ transaction },
			);

			const permissionMap = Object.fromEntries(permissionRows.map((row) => [row.resource_code, row.id]));
			const permissionsByRole = {
				SUPER_ADMIN: [
					'DASHBOARD',
					'CINEMAS',
					'EMPLOYEES',
					'SHOWTIMES',
					'INVENTORY',
					'CATALOGS',
					'LOYALTY',
					'BOOKING',
					'REPORTS',
					'INVOICES',
					'FINANCES',
					'POS',
					'CASHIER_DASHBOARD',
					'CONCESSIONS',
				],
				GENERAL_MANAGER: [
					'DASHBOARD',
					'CINEMAS',
					'EMPLOYEES',
					'SHOWTIMES',
					'INVENTORY',
					'CATALOGS',
					'LOYALTY',
					'BOOKING',
					'REPORTS',
					'INVOICES',
					'FINANCES',
					'POS',
					'CASHIER_DASHBOARD',
					'CONCESSIONS',
				],
				CINEMA_MANAGER: [
					'DASHBOARD',
					'CINEMAS',
					'EMPLOYEES',
					'SHOWTIMES',
					'INVENTORY',
					'BOOKING',
					'REPORTS',
					'INVOICES',
					'CONCESSIONS',
				],
				CASHIER: ['SHOWTIMES', 'POS', 'CASHIER_DASHBOARD', 'CONCESSIONS'],
				USHER: ['SHOWTIMES'],
			};

			const rolePermValues = [];
			const skipped = [];

			for (const [roleCode, resources] of Object.entries(permissionsByRole)) {
				const roleId = roleMap[roleCode];
				if (!roleId) {
					skipped.push(`ROLE_NOT_FOUND:${roleCode}`);
					continue;
				}

				for (const resourceCode of resources) {
					const permissionId = permissionMap[resourceCode];
					if (!permissionId) {
						skipped.push(`${roleCode}:${resourceCode}`);
						continue;
					}
					rolePermValues.push({ role: roleId, permission: permissionId });
				}
			}

			if (rolePermValues.length > 0) {
				await queryInterface.bulkInsert('role_permissions', rolePermValues, {
					ignoreDuplicates: true,
					transaction,
				});
			}

			if (skipped.length > 0) {
				console.warn('[seed-role-access-permissions] Permisos omitidos:', skipped);
			}
		});
	},

	async down(queryInterface) {
		await queryInterface.sequelize.transaction(async (transaction) => {
			const roleCodes = ['SUPER_ADMIN', 'GENERAL_MANAGER', 'CINEMA_MANAGER', 'CASHIER', 'USHER'];
			const resourceCodes = [
				'DASHBOARD',
				'CINEMAS',
				'EMPLOYEES',
				'SHOWTIMES',
				'INVENTORY',
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
			const roleInClause = roleCodes.map((code) => `'${code}'`).join(',');
			const resourceInClause = resourceCodes.map((code) => `'${code}'`).join(',');

			await queryInterface.sequelize.query(
				`DELETE FROM role_permissions
                 WHERE role IN (SELECT id FROM roles WHERE code IN (${roleInClause}))
                   AND permission IN (
                     SELECT p.id FROM permissions p
                     JOIN resources r ON p.resource = r.id
                     JOIN actions a ON p.action = a.id
                     JOIN permission_types t ON p.permission_type = t.id
                     WHERE a.code = 'ACCESS' AND t.code = 'VIEW' AND r.code IN (${resourceInClause})
                   )`,
				{ transaction },
			);
		});
	},
};
