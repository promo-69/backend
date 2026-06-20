'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface) {
        await queryInterface.sequelize.transaction(async (transaction) => {
            // ------------------------------------------------------------------
            // 1. Recursos nuevos del módulo de reportes
            // ------------------------------------------------------------------
            const newResources = [
                { code: 'REPORTS-SALES', description: 'Reporte de ventas (sucursal autenticada)' },
                { code: 'REPORTS-MOVIES', description: 'Reporte de películas (sucursal autenticada)' },
                { code: 'REPORTS-EVENTS', description: 'Reporte de eventos especiales (sucursal autenticada)' },
                { code: 'REPORTS-INVENTORY', description: 'Reporte de inventario (sucursal autenticada)' },
                { code: 'REPORTS-CASHIER', description: 'Reporte de caja (turno del empleado)' },
                { code: 'REPORTS-SHOWTIMES', description: 'Reporte de funciones (sucursal autenticada)' },
                { code: 'REPORTS-RENTALS', description: 'Reporte de alquileres (sucursal autenticada)' },
                { code: 'REPORTS-EXPORT', description: 'Exportación de reportes (CSV, XLSX, PDF)' },
                { code: 'REPORTS-CHARTS', description: 'Datos de gráficos por tipo de reporte' },
                { code: 'REPORTS-DASHBOARD', description: 'Dashboard consolidado de reportes' },
                { code: 'REPORTS-ALL', description: 'Acceso superadmin a reportes de cualquier sucursal' },
            ];

            await queryInterface.bulkInsert('resources', newResources, {
                ignoreDuplicates: true,
                transaction,
            });

            // ------------------------------------------------------------------
            // 2. Cargar IDs necesarios
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

            if (!typeMap['CRUD']) throw new Error('Falta permission_type CRUD. Ejecutá primero el seeder core.');
            if (!actionMap['READ']) throw new Error('Falta acción READ. Ejecutá primero el seeder core.');

            // ------------------------------------------------------------------
            // 3. Crear permisos CRUD:READ para cada recurso de reportes
            // ------------------------------------------------------------------
            const permissionValues = newResources
                .filter((r) => resourceMap[r.code])
                .map((r) => ({
                    permission_type: typeMap['CRUD'],
                    action: actionMap['READ'],
                    resource: resourceMap[r.code],
                }));

            if (permissionValues.length) {
                await queryInterface.bulkInsert('permissions', permissionValues, {
                    ignoreDuplicates: true,
                    transaction,
                });
            }

            // ------------------------------------------------------------------
            // 4. Asignar todos los permisos de reportes al rol SUPER_ADMIN
            // ------------------------------------------------------------------
            const [superAdminRows] = await queryInterface.sequelize.query(
                `SELECT id FROM roles WHERE code = 'SUPER_ADMIN'`,
                { transaction },
            );

            if (superAdminRows.length) {
                const adminRoleId = superAdminRows[0].id;
                const resourceCodes = newResources.map((r) => `'${r.code}'`).join(',');

                const [permRows] = await queryInterface.sequelize.query(
                    `SELECT p.id
                     FROM permissions p
                     JOIN resources r ON p.resource = r.id
                     WHERE r.code IN (${resourceCodes})
                       AND p.action     = (SELECT id FROM actions          WHERE code = 'READ')
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

            // ------------------------------------------------------------------
            // 5. Asignar permisos relevantes al rol MANAGER si existe
            //    (reportes individuales + export + charts + dashboard, NO REPORTS-ALL)
            // ------------------------------------------------------------------
            const [managerRows] = await queryInterface.sequelize.query(`SELECT id FROM roles WHERE code = 'MANAGER'`, {
                transaction,
            });

            if (managerRows.length) {
                const managerRoleId = managerRows[0].id;
                const managerResourceCodes = [
                    'REPORTS-SALES',
                    'REPORTS-MOVIES',
                    'REPORTS-EVENTS',
                    'REPORTS-INVENTORY',
                    'REPORTS-CASHIER',
                    'REPORTS-SHOWTIMES',
                    'REPORTS-RENTALS',
                    'REPORTS-EXPORT',
                    'REPORTS-CHARTS',
                    'REPORTS-DASHBOARD',
                ];
                const managerCodes = managerResourceCodes.map((c) => `'${c}'`).join(',');

                const [managerPermRows] = await queryInterface.sequelize.query(
                    `SELECT p.id
                     FROM permissions p
                     JOIN resources r ON p.resource = r.id
                     WHERE r.code IN (${managerCodes})
                       AND p.action     = (SELECT id FROM actions          WHERE code = 'READ')
                       AND p.permission_type = (SELECT id FROM permission_types WHERE code = 'CRUD')`,
                    { transaction },
                );

                const managerRolePermValues = managerPermRows.map((p) => ({ role: managerRoleId, permission: p.id }));
                if (managerRolePermValues.length) {
                    await queryInterface.bulkInsert('role_permissions', managerRolePermValues, {
                        ignoreDuplicates: true,
                        transaction,
                    });
                }
            }
        });
    },

    async down(queryInterface) {
        await queryInterface.sequelize.transaction(async (transaction) => {
            const reportCodes = [
                'REPORTS-SALES',
                'REPORTS-MOVIES',
                'REPORTS-EVENTS',
                'REPORTS-INVENTORY',
                'REPORTS-CASHIER',
                'REPORTS-SHOWTIMES',
                'REPORTS-RENTALS',
                'REPORTS-EXPORT',
                'REPORTS-CHARTS',
                'REPORTS-DASHBOARD',
                'REPORTS-ALL',
            ];
            const inClause = reportCodes.map((c) => `'${c}'`).join(',');

            await queryInterface.sequelize.query(
                `DELETE FROM role_permissions
                 WHERE permission IN (
                     SELECT p.id FROM permissions p
                     JOIN resources r ON p.resource = r.id
                     WHERE r.code IN (${inClause})
                 )`,
                { transaction },
            );

            await queryInterface.sequelize.query(
                `DELETE FROM permissions
                 WHERE resource IN (
                     SELECT id FROM resources WHERE code IN (${inClause})
                 )`,
                { transaction },
            );

            await queryInterface.bulkDelete('resources', { code: reportCodes }, { transaction });
        });
    },
};
