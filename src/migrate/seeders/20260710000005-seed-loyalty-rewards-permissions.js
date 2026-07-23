'use strict';

/**
 * Seeder de permisos para el módulo de premios de fidelidad (loyalty-rewards).
 * @type {import('sequelize-cli').Migration}
 */
module.exports = {
	async up(queryInterface) {
		await queryInterface.sequelize.transaction(async (transaction) => {
			// 1. Insertar el recurso
			await queryInterface.bulkInsert(
				'resources',
				[{ code: 'LOYALTY-REWARDS', description: 'Premios de fidelidad (promociones canjeables)' }],
				{ ignoreDuplicates: true, transaction },
			);

			// 2. Cargar IDs necesarios
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

			if (!typeMap['CRUD']) {
				throw new Error(
					'Falta el permission_type CRUD. Ejecutá primero el seeder core (20260325061126-seed-core-catalogs).',
				);
			}
			if (!resourceMap['LOYALTY-REWARDS']) {
				throw new Error('El recurso LOYALTY-REWARDS no se insertó correctamente.');
			}

			// 3. Insertar los 4 permisos CRUD
			const permissionList = [
				['CRUD', 'READ', 'LOYALTY-REWARDS'],
				['CRUD', 'CREATE', 'LOYALTY-REWARDS'],
				['CRUD', 'UPDATE', 'LOYALTY-REWARDS'],
				['CRUD', 'DELETE', 'LOYALTY-REWARDS'],
			];

			const permissionValues = [];
			for (const [typeCode, actionCode, resourceCode] of permissionList) {
				const typeId = typeMap[typeCode];
				const actionId = actionMap[actionCode];
				const resourceId = resourceMap[resourceCode];
				if (!typeId || !actionId || !resourceId) {
					console.warn(
						`[seed-loyalty-rewards-permissions] Permiso omitido: ${typeCode}:${actionCode}:${resourceCode}`,
					);
					continue;
				}
				permissionValues.push({ permission_type: typeId, action: actionId, resource: resourceId });
			}

			if (permissionValues.length > 0) {
				await queryInterface.bulkInsert('permissions', permissionValues, {
					ignoreDuplicates: true,
					transaction,
				});
			}

			// 4. Asignar los 4 permisos al rol SUPER_ADMIN
			const [roleRows] = await queryInterface.sequelize.query(`SELECT id FROM roles WHERE code = 'SUPER_ADMIN'`, {
				transaction,
			});

			if (roleRows.length > 0) {
				const adminRoleId = roleRows[0].id;
				const [permRows] = await queryInterface.sequelize.query(
					`SELECT p.id
					 FROM permissions p
					 JOIN resources r ON p.resource = r.id
					 WHERE r.code = 'LOYALTY-REWARDS'`,
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
		});
	},

	async down(queryInterface) {
		await queryInterface.sequelize.transaction(async (transaction) => {
			await queryInterface.sequelize.query(
				`DELETE FROM role_permissions
				 WHERE permission IN (
				   SELECT p.id FROM permissions p
				   JOIN resources r ON p.resource = r.id
				   WHERE r.code = 'LOYALTY-REWARDS'
				 )`,
				{ transaction },
			);
			await queryInterface.sequelize.query(
				`DELETE FROM permissions
				 WHERE resource IN (
				   SELECT id FROM resources WHERE code = 'LOYALTY-REWARDS'
				 )`,
				{ transaction },
			);
			await queryInterface.bulkDelete('resources', { code: 'LOYALTY-REWARDS' }, { transaction });
		});
	},
};
