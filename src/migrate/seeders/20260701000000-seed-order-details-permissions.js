'use strict';

/**
 * Seeder de permisos para la validación de QR (control de entradas / confitería).
 * @type {import('sequelize-cli').Migration}
 */
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      // 1. Recursos
      await queryInterface.bulkInsert(
        'resources',
        [
          { code: 'ORDER-DETAILS', description: 'Detalle de órdenes para validación de QR (boletos y confitería)' },
          { code: 'QR', description: 'Acceso al lector de códigos QR (control de entradas)' },
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
        throw new Error(
          'Falta el permission_type CRUD. Ejecutá primero el seeder core (20260325061126-seed-core-catalogs).',
        );
      }

      // 3. Permisos [tipo, acción, recurso]
      const permissionList = [
        ['CRUD', 'READ', 'ORDER-DETAILS'],
        ['CRUD', 'UPDATE', 'ORDER-DETAILS'],
        ['VIEW', 'ACCESS', 'QR'],
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
        console.warn('[seed-order-details-permissions] Permisos omitidos por IDs faltantes:', skipped);
      }

      if (permissionValues.length > 0) {
        await queryInterface.bulkInsert('permissions', permissionValues, {
          ignoreDuplicates: true,
          transaction,
        });
      }

      // 4. Asignar a los roles operativos (ORDER-DETAILS + VIEW:ACCESS:QR).
      //    USHER (portero) es el principal; el resto por consistencia/oversight.
      const [permRows] = await queryInterface.sequelize.query(
        `SELECT p.id FROM permissions p
         JOIN resources r ON p.resource = r.id
         WHERE r.code IN ('ORDER-DETAILS', 'QR')`,
        { transaction },
      );
      const permissionIds = permRows.map((p) => p.id);

      const roleCodes = ['USHER', 'CASHIER', 'CINEMA_MANAGER', 'GENERAL_MANAGER', 'SUPER_ADMIN'];
      const rolesInClause = roleCodes.map((c) => `'${c}'`).join(',');
      const [roleRows] = await queryInterface.sequelize.query(
        `SELECT id, code FROM roles WHERE code IN (${rolesInClause})`,
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
      // Quitar los role_permissions y permisos de ORDER-DETAILS
      await queryInterface.sequelize.query(
        `DELETE FROM role_permissions
         WHERE permission IN (
           SELECT p.id FROM permissions p
           JOIN resources r ON p.resource = r.id
           WHERE r.code IN ('ORDER-DETAILS', 'QR')
         )`,
        { transaction },
      );

      await queryInterface.sequelize.query(
        `DELETE FROM permissions
         WHERE resource IN (SELECT id FROM resources WHERE code IN ('ORDER-DETAILS', 'QR'))`,
        { transaction },
      );

      await queryInterface.sequelize.query(`DELETE FROM resources WHERE code IN ('ORDER-DETAILS', 'QR')`, {
        transaction,
      });
    });
  },
};
