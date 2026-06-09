'use strict';

/**
 * Seeder de permisos para el módulo de reportes.
 *
 * Agrega recursos y permisos CRUD:READ para:
 *   - REPORTS_SALES
 *   - REPORTS_MOVIES
 *   - REPORTS_EVENTS
 *   - REPORTS_INVENTORY
 *   - REPORTS_CASHIER
 *   - REPORTS_SHOWTIMES
 *   - REPORTS_RENTALS
 *   - REPORTS_ALL       (para superadmin: acceso a datos de cualquier sucursal)
 *   - REPORTS_EXPORT    (para exportar a CSV/XLSX/PDF)
 *
 * Asigna todos estos permisos al rol SUPER_ADMIN.
 *
 * @type {import('sequelize-cli').Migration}
 */
module.exports = {
    async up(queryInterface) {
        await queryInterface.sequelize.transaction(async (transaction) => {
            // ------------------------------------------------------------------
            // 1. Recursos de reportes
            // ------------------------------------------------------------------
            const reportResources = [
                { code: 'REPORTS_SALES', description: 'Reporte de ventas (sucursal autenticada)' },
                { code: 'REPORTS_MOVIES', description: 'Reporte de películas (sucursal autenticada)' },
                { code: 'REPORTS_EVENTS', description: 'Reporte de eventos especiales (sucursal autenticada)' },
                { code: 'REPORTS_INVENTORY', description: 'Reporte de inventario (sucursal autenticada)' },
                { code: 'REPORTS_CASHIER', description: 'Reporte de caja (turno del empleado)' },
                { code: 'REPORTS_SHOWTIMES', description: 'Reporte de funciones (sucursal autenticada)' },
                { code: 'REPORTS_RENTALS', description: 'Reporte de alquileres (sucursal autenticada)' },
                { code: 'REPORTS_ALL', description: 'Acceso a reportes de cualquier sucursal (superadmin)' },
                { code: 'REPORTS_EXPORT', description: 'Exportación de reportes (CSV, XLSX, PDF)' },
            ];

            await queryInterface.bulkInsert('resources', reportResources, {
                ignoreDuplicates: true,
                transaction,
            });

            // ------------------------------------------------------------------
            // 2. Cargar IDs necesarios
            // ------------------------------------------------------------------
            const [actionRows] = await queryInterface.sequelize.query('SELECT id, code FROM actions', { transaction });
            const [resourceRows] = await queryInterface.sequelize.query('SELECT id, code FROM resources', { transaction });
            const [typeRows] = await queryInterface.sequelize.query('SELECT id, code FROM permission_types', { transaction });

            const actionMap = Object.fromEntries(actionRows.map((r) => [r.code, r.id]));
            const resourceMap = Object.fromEntries(resourceRows.map((r) => [r.code, r.id]));
            const typeMap = Object.fromEntries(typeRows.map((r) => [r.code, r.id]));

            const requiredTypes = ['CRUD'];
            const missingTypes = requiredTypes.filter((c) => !typeMap[c]);
            if (missingTypes.length) {
                throw new Error(`Faltan permission_types: ${missingTypes.join(', ')}. Ejecutá primero el seeder core.`);
            }

            // Verificar que exista la acción READ
            if (!actionMap['READ']) {
                throw new Error('La acción READ no existe en la BD. Ejecutá primero el seeder core.');
            }

            // ------------------------------------------------------------------
            // 3. Crear permisos CRUD:READ para cada recurso
            // ------------------------------------------------------------------
            const permissionValues = [];
            for (const resource of reportResources) {
                const resourceId = resourceMap[resource.code];
                if (!resourceId) {
                    console.warn(`[seed-reports-permissions] Recurso ${resource.code} no encontrado, omitiendo permiso.`);
                    continue;
                }
                permissionValues.push({
                    permission_type: typeMap['CRUD'],
                    action: actionMap['READ'],
                    resource: resourceId,
                });
            }

            if (permissionValues.length) {
                await queryInterface.bulkInsert('permissions', permissionValues, {
                    ignoreDuplicates: true,
                    transaction,
                });
            }

            // ------------------------------------------------------------------
            // 4. Asignar todos estos permisos al rol SUPER_ADMIN
            // ------------------------------------------------------------------
            const [roleRows] = await queryInterface.sequelize.query(
                `SELECT id FROM roles WHERE code = 'SUPER_ADMIN'`,
                { transaction },
            );

            if (roleRows.length) {
                const adminRoleId = roleRows[0].id;

                // Obtener IDs de los permisos recién insertados (o existentes)
                const resourceCodes = reportResources.map((r) => `'${r.code}'`).join(',');
                const [permRows] = await queryInterface.sequelize.query(
                    `SELECT p.id
                     FROM permissions p
                     JOIN resources r ON p.resource = r.id
                     WHERE r.code IN (${resourceCodes})
                       AND p.action = (SELECT id FROM actions WHERE code = 'READ')
                       AND p.permission_type = (SELECT id FROM permission_types WHERE code = 'CRUD')`,
                    { transaction },
                );

                const rolePermValues = permRows.map((p) => ({ role: adminRoleId, permission: p.id }));
                if (rolePermValues.length) {
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
            const reportResourceCodes = [
                'REPORTS_SALES',
                'REPORTS_MOVIES',
                'REPORTS_EVENTS',
                'REPORTS_INVENTORY',
                'REPORTS_CASHIER',
                'REPORTS_SHOWTIMES',
                'REPORTS_RENTALS',
                'REPORTS_ALL',
                'REPORTS_EXPORT',
            ];
            const inClause = reportResourceCodes.map((c) => `'${c}'`).join(',');

            // Eliminar role_permissions asociados
            await queryInterface.sequelize.query(
                `DELETE FROM role_permissions
                 WHERE permission IN (
                   SELECT p.id FROM permissions p
                   JOIN resources r ON p.resource = r.id
                   WHERE r.code IN (${inClause})
                 )`,
                { transaction },
            );

            // Eliminar permisos
            await queryInterface.sequelize.query(
                `DELETE FROM permissions
                 WHERE resource IN (
                   SELECT id FROM resources WHERE code IN (${inClause})
                 )`,
                { transaction },
            );

            // Eliminar recursos
            await queryInterface.bulkDelete('resources', { code: reportResourceCodes }, { transaction });
        });
    },
};
