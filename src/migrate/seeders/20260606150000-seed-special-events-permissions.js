'use strict';

/**
 * Seeder de permisos para el módulo de eventos especiales.
 *
 * Agrega:
 *  - Recurso SPECIAL_EVENTS (gestión global de contenido)
 *  - 4 permisos CRUD para ese recurso
 *  - Asignación automática de los 4 permisos al rol SUPER_ADMIN
 *
 * Los empleados de sucursal NO reciben permisos de SPECIAL_EVENTS porque
 * los eventos especiales son contenido global (los crea solo el super admin).
 * Lo que sí crean los empleados son las funciones (showtimes), que ya están
 * cubiertas por los permisos CRUD:CREATE:SHOWTIMES del seeder anterior.
 *
 * @type {import('sequelize-cli').Migration}
 */
module.exports = {
    async up(queryInterface) {
        await queryInterface.sequelize.transaction(async (transaction) => {
            // ------------------------------------------------------------------
            // 1. Insertar el recurso SPECIAL_EVENTS
            // ------------------------------------------------------------------
            await queryInterface.bulkInsert(
                'resources',
                [{ code: 'SPECIAL_EVENTS', description: 'Eventos especiales (contenido global)' }],
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
                        'Ejecutá primero el seeder core (20260325061126-seed-core-catalogs).',
                );
            }

            if (!resourceMap['SPECIAL_EVENTS']) {
                throw new Error('El recurso SPECIAL_EVENTS no se insertó correctamente.');
            }

            // ------------------------------------------------------------------
            // 3. Insertar los 4 permisos CRUD para SPECIAL_EVENTS
            // ------------------------------------------------------------------
            const permissionList = [
                ['CRUD', 'READ', 'SPECIAL_EVENTS'],
                ['CRUD', 'CREATE', 'SPECIAL_EVENTS'],
                ['CRUD', 'UPDATE', 'SPECIAL_EVENTS'],
                ['CRUD', 'DELETE', 'SPECIAL_EVENTS'],
            ];

            const permissionValues = [];
            for (const [typeCode, actionCode, resourceCode] of permissionList) {
                const typeId = typeMap[typeCode];
                const actionId = actionMap[actionCode];
                const resourceId = resourceMap[resourceCode];
                if (!typeId || !actionId || !resourceId) {
                    console.warn(`[seed-special-events-permissions] Permiso omitido: ${typeCode}:${actionCode}:${resourceCode}`);
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
            // 4. Asignar los 4 permisos al rol SUPER_ADMIN
            // ------------------------------------------------------------------
            const [roleRows] = await queryInterface.sequelize.query(
                `SELECT id FROM roles WHERE code = 'SUPER_ADMIN'`,
                { transaction },
            );

            if (roleRows.length > 0) {
                const adminRoleId = roleRows[0].id;

                const [permRows] = await queryInterface.sequelize.query(
                    `SELECT p.id
                     FROM permissions p
                     JOIN resources r ON p.resource = r.id
                     WHERE r.code = 'SPECIAL_EVENTS'`,
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
            // Eliminar role_permissions asociados a SPECIAL_EVENTS
            await queryInterface.sequelize.query(
                `DELETE FROM role_permissions
                 WHERE permission IN (
                   SELECT p.id FROM permissions p
                   JOIN resources r ON p.resource = r.id
                   WHERE r.code = 'SPECIAL_EVENTS'
                 )`,
                { transaction },
            );

            // Eliminar los permisos
            await queryInterface.sequelize.query(
                `DELETE FROM permissions
                 WHERE resource IN (
                   SELECT id FROM resources WHERE code = 'SPECIAL_EVENTS'
                 )`,
                { transaction },
            );

            // Eliminar el recurso
            await queryInterface.bulkDelete('resources', { code: 'SPECIAL_EVENTS' }, { transaction });
        });
    },
};
