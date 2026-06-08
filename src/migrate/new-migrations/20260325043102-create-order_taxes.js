'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
	async up(queryInterface, Sequelize) {
		await queryInterface.sequelize.transaction(async (transaction) => {
			await queryInterface.createTable('order_taxes', { id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false }, order: { type: Sequelize.INTEGER, allowNull: false }, tax: { type: Sequelize.INTEGER, allowNull: false }, applied_rate: { type: Sequelize.DECIMAL(10, 2), allowNull: false }, tax_amount_base_currency: { type: Sequelize.DECIMAL(10, 2), allowNull: false }, deleted_at: { type: Sequelize.DATE, allowNull: true } }, { transaction });
			await queryInterface.addIndex('order_taxes', ['order'], { name: 'idx_order_taxes_order' , transaction });
			await queryInterface.addConstraint('order_taxes', { fields: ['order'], type: 'foreign key', name: 'fk_order_taxes_order', references: { table: 'orders', field: 'id' }, onDelete: 'RESTRICT', onUpdate: 'CASCADE' , transaction });
			await queryInterface.addConstraint('order_taxes', { fields: ['tax'], type: 'foreign key', name: 'fk_order_taxes_tax', references: { table: 'taxes', field: 'id' }, onDelete: 'RESTRICT', onUpdate: 'CASCADE' , transaction });
			await queryInterface.sequelize.query(`ALTER TABLE order_taxes ADD CONSTRAINT chk_order_taxes_amounts CHECK (applied_rate >= 0 AND tax_amount_base_currency >= 0);`, { transaction });
		});
	},

	async down(queryInterface, Sequelize) {
		await queryInterface.dropTable('order_taxes');
	}
};
