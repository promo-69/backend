'use strict';

/**
 * Seeder para restringir los permisos del módulo de pagos (PAYMENTS_MODULE).
 * Históricamente se asignaron a todos los roles, por lo que este script
 * elimina el acceso a operadores o roles inferiores y lo restringe
 * únicamente al Gerente General (y al Super Admin por seguridad).
 *
 * @type {import('sequelize-cli').Migration}
 */
module.exports = {
    async up(queryInterface) {
        await queryInterface.sequelize.transaction(async (transaction) => {
            // 1. Obtener IDs de los permisos del módulo de pagos
            const [permRows] = await queryInterface.sequelize.query(
                `SELECT p.id 
                 FROM permissions p 
                 JOIN resources r ON p.resource = r.id 
                 WHERE r.code = 'PAYMENTS_MODULE'`,
                { transaction }
            );

            if (permRows.length === 0) {
                console.log('No se encontraron permisos para PAYMENTS_MODULE.');
                return;
            }

            const permIds = permRows.map(p => p.id).join(',');

            // 2. Obtener IDs de los roles permitidos
            const [roleRows] = await queryInterface.sequelize.query(
                `SELECT id FROM roles WHERE code IN ('GENERAL_MANAGER', 'SUPER_ADMIN')`,
                { transaction }
            );

            if (roleRows.length === 0) return;

            const allowedRoleIds = roleRows.map(r => r.id).join(',');

            // 3. Eliminar los permisos de todos los roles que NO sean los permitidos
            await queryInterface.sequelize.query(
                `DELETE FROM role_permissions 
                 WHERE permission IN (${permIds}) 
                   AND role NOT IN (${allowedRoleIds})`,
                { transaction }
            );
        });
    },

    async down(queryInterface) {
        await queryInterface.sequelize.transaction(async (transaction) => {
            // En un rollback, podríamos reasignar los permisos a todos los roles
            // tal como estaba originalmente en refactor-payment-methods.
            const [permRows] = await queryInterface.sequelize.query(
                `SELECT p.id FROM permissions p JOIN resources r ON p.resource = r.id WHERE r.code = 'PAYMENTS_MODULE'`,
                { transaction }
            );

            if (permRows.length === 0) return;

            const [roles] = await queryInterface.sequelize.query(`SELECT id FROM roles`, { transaction });
            const rolePermissions = [];

            for (const r of roles) {
                for (const p of permRows) {
                    rolePermissions.push({ role: r.id, permission: p.id });
                }
            }

            if (rolePermissions.length > 0) {
                await queryInterface.bulkInsert('role_permissions', rolePermissions, { ignoreDuplicates: true, transaction });
            }
        });
    }
};
