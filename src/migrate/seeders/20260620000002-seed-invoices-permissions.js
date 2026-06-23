'use strict';

/**
 * Seeder de permisos del módulo de facturación
 * @type {import('sequelize-cli').Migration}
 */
module.exports = {
    async up(queryInterface) {
        await queryInterface.sequelize.transaction(async (transaction) => {
            // ------------------------------------------------------------------
            // 1. Recursos nuevos del módulo de facturación
            // ------------------------------------------------------------------
            await queryInterface.bulkInsert(
                'resources',
                [
                    { code: 'INVOICES', description: 'Facturas (lectura y detalle)' },
                    { code: 'INVOICES-EXPORT', description: 'Exportación de facturas en PDF' },
                    { code: 'INVOICES-VOID', description: 'Anulación de facturas' },
                    { code: 'INVOICES-ALL', description: 'Acceso superadmin a facturas de cualquier sede' },
                ],
                { ignoreDuplicates: true, transaction },
            );

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

            const missingTypes = ['VIEW', 'CRUD', 'FEAT'].filter((c) => !typeMap[c]);
            if (missingTypes.length > 0) {
                throw new Error(
                    `Faltan permission_types en la BD: ${missingTypes.join(', ')}. ` +
                        'Ejecutá primero el seeder core (20260325061126-seed-core-catalogs).',
                );
            }

            // ------------------------------------------------------------------
            // 3. Lista de permisos — formato [tipo, acción, recurso]
            // ------------------------------------------------------------------
            const permissionList = [
                ['CRUD', 'READ', 'INVOICES'],
                ['CRUD', 'READ', 'INVOICES-EXPORT'],
                ['CRUD', 'DELETE', 'INVOICES-VOID'],
                ['CRUD', 'READ', 'INVOICES-ALL'],
            ];

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
                console.warn('[seed-invoices-permissions] Permisos omitidos por IDs faltantes:', skipped);
            }

            if (permissionValues.length > 0) {
                await queryInterface.bulkInsert('permissions', permissionValues, {
                    ignoreDuplicates: true,
                    transaction,
                });
            }

            // ------------------------------------------------------------------
            // 4. SUPER_ADMIN — todos los permisos de facturación
            // ------------------------------------------------------------------
            const [superAdminRows] = await queryInterface.sequelize.query(
                `SELECT id FROM roles WHERE code = 'SUPER_ADMIN'`,
                { transaction },
            );

            const allInvoiceResourceCodes = ['INVOICES', 'INVOICES-EXPORT', 'INVOICES-VOID', 'INVOICES-ALL'];
            const allInClause = allInvoiceResourceCodes.map((c) => `'${c}'`).join(',');

            if (superAdminRows.length > 0) {
                const adminRoleId = superAdminRows[0].id;
                const [permRows] = await queryInterface.sequelize.query(
                    `SELECT p.id FROM permissions p JOIN resources r ON p.resource = r.id WHERE r.code IN (${allInClause})`,
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
            // 5. CINEMA_MANAGER (gerente de sede) — lectura, export y anulación
            //    de su propia sede. NO recibe INVOICES-ALL (eso es solo superadmin).
            // ------------------------------------------------------------------
            const [cmRoleRows] = await queryInterface.sequelize.query(
                `SELECT id FROM roles WHERE code = 'CINEMA_MANAGER'`,
                { transaction },
            );

            if (cmRoleRows.length > 0) {
                const cmRoleId = cmRoleRows[0].id;
                const cmResourceCodes = ['INVOICES', 'INVOICES-EXPORT', 'INVOICES-VOID'];
                const cmInClause = cmResourceCodes.map((c) => `'${c}'`).join(',');
                const [permRows] = await queryInterface.sequelize.query(
                    `SELECT p.id FROM permissions p JOIN resources r ON p.resource = r.id WHERE r.code IN (${cmInClause})`,
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

            // ------------------------------------------------------------------
            // 6. GENERAL_MANAGER — lectura y export de cualquier sede (no anula)
            // ------------------------------------------------------------------
            const [gmRoleRows] = await queryInterface.sequelize.query(
                `SELECT id FROM roles WHERE code = 'GENERAL_MANAGER'`,
                { transaction },
            );

            if (gmRoleRows.length > 0) {
                const gmRoleId = gmRoleRows[0].id;
                const gmResourceCodes = ['INVOICES', 'INVOICES-EXPORT', 'INVOICES-ALL'];
                const gmInClause = gmResourceCodes.map((c) => `'${c}'`).join(',');
                const [permRows] = await queryInterface.sequelize.query(
                    `SELECT p.id FROM permissions p JOIN resources r ON p.resource = r.id WHERE r.code IN (${gmInClause})`,
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
        });
    },

    async down(queryInterface) {
        await queryInterface.sequelize.transaction(async (transaction) => {
            const resourceCodes = ['INVOICES', 'INVOICES-EXPORT', 'INVOICES-VOID', 'INVOICES-ALL'];
            const inClause = resourceCodes.map((c) => `'${c}'`).join(',');

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

            await queryInterface.bulkDelete('resources', { code: resourceCodes }, { transaction });
        });
    },
};
