'use strict';

/**
 * Seeder de permisos para rutas del frontend:
 * - VIEW:ACCESS:CURRENCIES-PAGE
 * - VIEW:ACCESS:EXCHANGE-RATES
 * - VIEW:ACCESS:BANK-ACCOUNTS
 *
 * Asignados únicamente al rol de Gerente General.
 *
 * @type {import('sequelize-cli').Migration}
 */
module.exports = {
    async up(queryInterface) {
        await queryInterface.sequelize.transaction(async (transaction) => {
            // 1. Insertar recursos
            await queryInterface.bulkInsert(
                'resources',
                [
                    { code: 'CURRENCIES-PAGE', description: 'Vista de Monedas' },
                    { code: 'EXCHANGE-RATES', description: 'Vista de Tasas de Cambio' },
                    { code: 'BANK-ACCOUNTS', description: 'Vista de Cuentas Bancarias' },
                ],
                { ignoreDuplicates: true, transaction }
            );

            // 2. Cargar IDs
            const [actionRows] = await queryInterface.sequelize.query('SELECT id, code FROM actions', { transaction });
            const [resourceRows] = await queryInterface.sequelize.query('SELECT id, code FROM resources', { transaction });
            const [typeRows] = await queryInterface.sequelize.query('SELECT id, code FROM permission_types', { transaction });

            const actionMap = Object.fromEntries(actionRows.map((r) => [r.code, r.id]));
            const resourceMap = Object.fromEntries(resourceRows.map((r) => [r.code, r.id]));
            const typeMap = Object.fromEntries(typeRows.map((r) => [r.code, r.id]));

            const viewTypeId = typeMap['VIEW'];
            const accessActionId = actionMap['ACCESS'];

            if (!viewTypeId || !accessActionId) {
                throw new Error('Faltan tipos o acciones base (VIEW, ACCESS).');
            }

            // 3. Insertar permisos
            const permissionList = [
                ['CURRENCIES-PAGE'],
                ['EXCHANGE-RATES'],
                ['BANK-ACCOUNTS']
            ];

            const permissionValues = [];
            for (const [resourceCode] of permissionList) {
                const resourceId = resourceMap[resourceCode];
                if (!resourceId) continue;
                permissionValues.push({ permission_type: viewTypeId, action: accessActionId, resource: resourceId });
            }

            if (permissionValues.length > 0) {
                await queryInterface.bulkInsert('permissions', permissionValues, { ignoreDuplicates: true, transaction });
            }

            // 4. Asignar al Gerente General
            const [roleRows] = await queryInterface.sequelize.query(
                `SELECT id FROM roles WHERE code = 'GENERAL_MANAGER'`,
                { transaction }
            );

            if (roleRows.length > 0) {
                const [permRows] = await queryInterface.sequelize.query(
                    `SELECT p.id
                     FROM permissions p
                     JOIN resources r ON p.resource = r.id
                     WHERE r.code IN ('CURRENCIES-PAGE', 'EXCHANGE-RATES', 'BANK-ACCOUNTS')
                       AND p.permission_type = ${viewTypeId}
                       AND p.action = ${accessActionId}`,
                    { transaction }
                );

                const rolePermValues = [];
                for (const role of roleRows) {
                    for (const perm of permRows) {
                        rolePermValues.push({ role: role.id, permission: perm.id });
                    }
                }

                if (rolePermValues.length > 0) {
                    await queryInterface.bulkInsert('role_permissions', rolePermValues, { ignoreDuplicates: true, transaction });
                }
            }
        });
    },

    async down(queryInterface) {
        await queryInterface.sequelize.transaction(async (transaction) => {
            const [typeRows] = await queryInterface.sequelize.query("SELECT id FROM permission_types WHERE code = 'VIEW'", { transaction });
            const [actionRows] = await queryInterface.sequelize.query("SELECT id FROM actions WHERE code = 'ACCESS'", { transaction });
            
            if (typeRows.length === 0 || actionRows.length === 0) return;
            const viewTypeId = typeRows[0].id;
            const accessActionId = actionRows[0].id;

            // Eliminar role_permissions
            await queryInterface.sequelize.query(
                `DELETE FROM role_permissions 
                 WHERE permission IN (
                     SELECT p.id FROM permissions p 
                     JOIN resources r ON p.resource = r.id 
                     WHERE r.code IN ('CURRENCIES-PAGE', 'EXCHANGE-RATES', 'BANK-ACCOUNTS')
                       AND p.permission_type = ${viewTypeId}
                       AND p.action = ${accessActionId}
                 )`,
                { transaction }
            );

            // Eliminar permissions
            await queryInterface.sequelize.query(
                `DELETE FROM permissions 
                 WHERE resource IN (SELECT id FROM resources WHERE code IN ('CURRENCIES-PAGE', 'EXCHANGE-RATES', 'BANK-ACCOUNTS'))
                   AND permission_type = ${viewTypeId}
                   AND action = ${accessActionId}`,
                { transaction }
            );
        });
    }
};
