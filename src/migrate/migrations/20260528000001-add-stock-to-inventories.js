'use strict';

/**
 * FIX #1.1: La tabla inventories fue creada sin la columna 'stock'.
 * Dos servicios (InventoryManagementService y OrdersService.processCheckout)
 * leen y escriben inventory.stock, lo que causaba NaN en los cálculos de stock disponible.
 *
 * Se agrega la columna y se inicializa su valor a partir del histórico de inventory_movements.
 *
 * @type {import('sequelize-cli').Migration}
 */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.sequelize.transaction(async (transaction) => {
            // 1. Agregar la columna stock con valor inicial 0
            await queryInterface.addColumn(
                'inventories',
                'stock',
                {
                    type: Sequelize.INTEGER,
                    allowNull: false,
                    defaultValue: 0,
                    comment: 'Stock físico actual. Se actualiza con cada inventory_movement.',
                },
                { transaction },
            );

            // 2. Reconstruir el stock actual para cada inventario a partir del historial
            //    de movimientos usando la columna resulting_stock del último movimiento.
            await queryInterface.sequelize.query(
                `
				UPDATE inventories i
				SET stock = COALESCE(
					(
						SELECT m.resulting_stock
						FROM inventory_movements m
						WHERE m.inventory = i.id
						  AND m.deleted_at IS NULL
						ORDER BY m.id DESC
						LIMIT 1
					),
					0
				)
				WHERE i.deleted_at IS NULL;
				`,
                { transaction },
            );

            // 3. Índice para acelerar consultas de stock por cinema + product
            await queryInterface.addIndex('inventories', ['stock'], {
                name: 'idx_inventories_stock',
                transaction,
            });

            // 4. Constraint: el stock nunca puede ser negativo
            await queryInterface.sequelize.query(
                'ALTER TABLE inventories ADD CONSTRAINT chk_inventories_stock CHECK (stock >= 0);',
                { transaction },
            );
        });
    },

    async down(queryInterface) {
        await queryInterface.sequelize.transaction(async (transaction) => {
            await queryInterface.sequelize.query(
                'ALTER TABLE inventories DROP CONSTRAINT IF EXISTS chk_inventories_stock;',
                { transaction },
            );
            await queryInterface.removeIndex('inventories', 'idx_inventories_stock', { transaction });
            await queryInterface.removeColumn('inventories', 'stock', { transaction });
        });
    },
};
