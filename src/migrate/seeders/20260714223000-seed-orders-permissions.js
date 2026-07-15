'use strict';

/**
 * Seeder de permisos para consultar órdenes.
 * @type {import('sequelize-cli').Migration}
 */
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      // 1. Recursos
      await queryInterface.bulkInsert(
        'resources',
        [
          { code: 'ORDERS', description: 'Listado y manejo general de órdenes' },
        ],
        { ignoreDuplicates: true, transaction },
      );

      // 2. IDs de catálogos
      const [actionRows] = await queryInterface.sequelize.query('SELECT id, code FROM actions', { transaction });
      const [resourceRows] = await queryInterface.sequelize.query('SELECT id, code FROM resources', { transaction });
      const [typeRows] = await queryInterface.sequelize.query('SELECT id, code FROM permission_types', {
        transaction,
      });

      const actionMap = Object.fromEntries(actionRows.map((r) => [r.code, r.id]));
      const resourceMap = Object.fromEntries(resourceRows.map((r) => [r.code, r.id]));
      const typeMap = Object.fromEntries(typeRows.map((r) => [r.code, r.id]));

      if (!typeMap['CRUD']) {
        throw new Error('Falta el permission_type CRUD. Asegúrate de ejecutar los seeders iniciales.');
      }

      // 3. Permisos [tipo, acción, recurso]
      const permissionList = [
        ['CRUD', 'READ', 'ORDERS'],
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
        console.warn('[seed-orders-permissions] Permisos omitidos por IDs faltantes:', skipped);
      }

      if (permissionValues.length > 0) {
        await queryInterface.bulkInsert('permissions', permissionValues, {
          ignoreDuplicates: true,
          transaction,
        });
      }

      // 4. Asignar a todos los roles
      const [permRows] = await queryInterface.sequelize.query(
        `SELECT p.id FROM permissions p
         JOIN resources r ON p.resource = r.id
         WHERE r.code = 'ORDERS'`,
        { transaction },
      );
      const permissionIds = permRows.map((p) => p.id);

      const [roleRows] = await queryInterface.sequelize.query(
        `SELECT id, code FROM roles`,
        { transaction },
      );

      const rolePermValues = [];
      for (const role of roleRows) {
        for (const permId of permissionIds) {
          rolePermValues.push({ role: role.id, permission: permId });
        }
      }

      if (rolePermValues.length > 0) {
        await queryInterface.bulkInsert('role_permissions', rolePermValues, {
          ignoreDuplicates: true,
          transaction,
        });
      }
    });
  },

  async down(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      // Quitar los role_permissions de ORDERS
      await queryInterface.sequelize.query(
        `DELETE FROM role_permissions
         WHERE permission IN (
           SELECT p.id FROM permissions p
           JOIN resources r ON p.resource = r.id
           WHERE r.code = 'ORDERS'
         )`,
        { transaction },
      );

      // Quitar el permiso de ORDERS
      await queryInterface.sequelize.query(
        `DELETE FROM permissions
         WHERE resource IN (SELECT id FROM resources WHERE code = 'ORDERS')`,
        { transaction },
      );

      // Quitar el recurso ORDERS
      await queryInterface.sequelize.query(`DELETE FROM resources WHERE code = 'ORDERS'`, {
        transaction,
      });
    });
  },
};
