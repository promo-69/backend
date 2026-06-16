'use strict';

/**
 * Seeder de permisos para el módulo de monedas (currencies).
 *
 * Agrega:
 *  - Recurso CURRENCIES (gestión global de monedas)
 *  - 4 permisos CRUD para ese recurso
 *  - Asignación automática de los 4 permisos a SUPER_ADMIN y GENERAL_MANAGER
 *
 * @type {import('sequelize-cli').Migration}
 */
module.exports = {
    async up(queryInterface) {
        await queryInterface.sequelize.transaction(async (transaction) => {
            // ------------------------------------------------------------------
            // 1. Insertar el recurso CURRENCIES
            // ------------------------------------------------------------------
            await queryInterface.bulkInsert(
                'resources',
                [{ code: 'CURRENCIES', description: 'Monedas (gestión global)' }],
                { ignoreDuplicates: true, transaction },
            );

            // ------------------------------------------------------------------
            // 2. Cargar IDs necesarios desde la BD
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

            const missingTypes = ['CRUD'].filter((c) => !typeMap[c]);
            if (missingTypes.length > 0) {
                throw new Error(
                    `Faltan permission_types en la BD: ${missingTypes.join(', ')}. ` +
                        'Ejecutá primero el seeder core.',
                );
            }

            if (!resourceMap['CURRENCIES']) {
                throw new Error('El recurso CURRENCIES no se insertó correctamente.');
            }

            // ------------------------------------------------------------------
            // 3. Insertar los 4 permisos CRUD para CURRENCIES
            // ------------------------------------------------------------------
            const permissionList = [
                ['CRUD', 'READ', 'CURRENCIES'],
                ['CRUD', 'CREATE', 'CURRENCIES'],
                ['CRUD', 'UPDATE', 'CURRENCIES'],
                ['CRUD', 'DELETE', 'CURRENCIES'],
            ];

            const permissionValues = [];
            for (const [typeCode, actionCode, resourceCode] of permissionList) {
                const typeId = typeMap[typeCode];
                const actionId = actionMap[actionCode];
                const resourceId = resourceMap[resourceCode];
                if (!typeId || !actionId || !resourceId) {
                    console.warn(`[seed-currencies-permissions] Permiso omitido: ${typeCode}:${actionCode}:${resourceCode}`);
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

            // ------------------------------------------------------------------
            // 4. Asignar los 4 permisos a SUPER_ADMIN y GENERAL_MANAGER
            // ------------------------------------------------------------------
            const [roleRows] = await queryInterface.sequelize.query(
                `SELECT id FROM roles WHERE code IN ('SUPER_ADMIN', 'GENERAL_MANAGER')`,
                { transaction },
            );

            if (roleRows.length > 0) {
                const [permRows] = await queryInterface.sequelize.query(
                    `SELECT p.id
                     FROM permissions p
                     JOIN resources r ON p.resource = r.id
                     WHERE r.code = 'CURRENCIES'`,
                    { transaction },
                );

                const rolePermValues = [];
                for (const role of roleRows) {
                    for (const perm of permRows) {
                        rolePermValues.push({ role: role.id, permission: perm.id });
                    }
                }

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
            // Eliminar role_permissions asociados a CURRENCIES
            await queryInterface.sequelize.query(
                `DELETE FROM role_permissions
                 WHERE permission IN (
                   SELECT p.id FROM permissions p
                   JOIN resources r ON p.resource = r.id
                   WHERE r.code = 'CURRENCIES'
                 )`,
                { transaction },
            );

            // Eliminar los permisos
            await queryInterface.sequelize.query(
                `DELETE FROM permissions
                 WHERE resource IN (
                   SELECT id FROM resources WHERE code = 'CURRENCIES'
                 )`,
                { transaction },
            );

            // Eliminar el recurso
            await queryInterface.bulkDelete('resources', { code: 'CURRENCIES' }, { transaction });
        });
    },
};
