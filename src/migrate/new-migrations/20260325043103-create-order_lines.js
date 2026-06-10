'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
	async up(queryInterface, Sequelize) {
		await queryInterface.sequelize.transaction(async (transaction) => {
			await queryInterface.createTable('order_lines', { id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false }, order: { type: Sequelize.INTEGER, allowNull: false }, line_type: { type: Sequelize.INTEGER, allowNull: false }, product: { type: Sequelize.INTEGER, allowNull: true }, combo: { type: Sequelize.INTEGER, allowNull: true }, quantity: { type: Sequelize.INTEGER, allowNull: false }, original_unit_price: { type: Sequelize.DECIMAL(10, 2), allowNull: false }, unit_price: { type: Sequelize.DECIMAL(10, 2), allowNull: false }, quoted_exchange_rate: { type: Sequelize.INTEGER, allowNull: false }, deleted_at: { type: Sequelize.DATE, allowNull: true } }, { transaction });
			await queryInterface.addIndex('order_lines', ['order'], { name: 'idx_order_lines_order' , transaction });
			await queryInterface.addConstraint('order_lines', { fields: ['order'], type: 'foreign key', name: 'fk_order_lines_order', references: { table: 'orders', field: 'id' }, onDelete: 'RESTRICT', onUpdate: 'CASCADE' , transaction });
			await queryInterface.addConstraint('order_lines', { fields: ['line_type'], type: 'foreign key', name: 'fk_order_lines_line_type', references: { table: 'line_types', field: 'id' }, onDelete: 'RESTRICT', onUpdate: 'CASCADE' , transaction });
			await queryInterface.addConstraint('order_lines', { fields: ['product'], type: 'foreign key', name: 'fk_order_lines_product', references: { table: 'products', field: 'id' }, onDelete: 'RESTRICT', onUpdate: 'CASCADE' , transaction });
			await queryInterface.addConstraint('order_lines', { fields: ['combo'], type: 'foreign key', name: 'fk_order_lines_combo', references: { table: 'combos', field: 'id' }, onDelete: 'RESTRICT', onUpdate: 'CASCADE' , transaction });
			await queryInterface.addConstraint('order_lines', { fields: ['quoted_exchange_rate'], type: 'foreign key', name: 'fk_order_lines_quoted_exchange_rate', references: { table: 'exchange_rates', field: 'id' }, onDelete: 'RESTRICT', onUpdate: 'CASCADE' , transaction });
			await queryInterface.sequelize.query(`ALTER TABLE order_lines ADD CONSTRAINT chk_order_lines_logic CHECK (
				quantity > 0 AND original_unit_price >= 0 AND unit_price >= 0 AND
				((line_type = 1 AND product IS NOT NULL AND combo IS NULL) OR
				(line_type = 2 AND product IS NULL AND combo IS NOT NULL))
            );`, { transaction });
		});
	},

	async down(queryInterface, Sequelize) {
		await queryInterface.dropTable('order_lines');
	}
};
