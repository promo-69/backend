'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
	async up(queryInterface, Sequelize) {
		await queryInterface.sequelize.transaction(async (transaction) => {
			await queryInterface.createTable('inventory_movements', { id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false }, inventory: { type: Sequelize.INTEGER, allowNull: false }, operation_type: { type: Sequelize.INTEGER, allowNull: false }, quantity: { type: Sequelize.INTEGER, allowNull: false }, unit_cost: { type: Sequelize.DECIMAL(10, 2), allowNull: false, defaultValue: 0 }, currency: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 1 }, user: { type: Sequelize.INTEGER, allowNull: false }, resulting_stock: { type: Sequelize.INTEGER, allowNull: false }, resulting_unit_cost_base_currency: { type: Sequelize.DECIMAL(10, 2), allowNull: false }, created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }, remarks: { type: Sequelize.STRING(255), allowNull: true }, deleted_at: { type: Sequelize.DATE, allowNull: true } }, { transaction });
			await queryInterface.addIndex('inventory_movements', ['inventory', 'operation_type'], { name: 'idx_inv_mov_calc' , transaction });
			await queryInterface.addConstraint('inventory_movements', { fields: ['inventory'], type: 'foreign key', name: 'fk_inventory_movements_inventory', references: { table: 'inventories', field: 'id' }, onDelete: 'RESTRICT', onUpdate: 'CASCADE' , transaction });
			await queryInterface.addConstraint('inventory_movements', { fields: ['operation_type'], type: 'foreign key', name: 'fk_inventory_movements_operation_type', references: { table: 'operation_types', field: 'id' }, onDelete: 'RESTRICT', onUpdate: 'CASCADE' , transaction });
			await queryInterface.addConstraint('inventory_movements', { fields: ['currency'], type: 'foreign key', name: 'fk_inventory_movements_currency', references: { table: 'currencies', field: 'id' }, onDelete: 'RESTRICT', onUpdate: 'CASCADE' , transaction });
			await queryInterface.addConstraint('inventory_movements', { fields: ['user'], type: 'foreign key', name: 'fk_inventory_movements_user', references: { table: 'users', field: 'id' }, onDelete: 'RESTRICT', onUpdate: 'CASCADE' , transaction });
			await queryInterface.sequelize.query(`ALTER TABLE inventory_movements ADD CONSTRAINT chk_inventory_movements_qty CHECK (quantity > 0);`, { transaction });
			await queryInterface.sequelize.query(`ALTER TABLE inventory_movements ADD CONSTRAINT chk_inventory_movements_cost CHECK (unit_cost >= 0);`, { transaction });
		});
	},

	async down(queryInterface, Sequelize) {
		await queryInterface.dropTable('inventory_movements');
	}
};
