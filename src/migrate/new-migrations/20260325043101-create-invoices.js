'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
	async up(queryInterface, Sequelize) {
		await queryInterface.sequelize.transaction(async (transaction) => {
			await queryInterface.createTable('invoices', { id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false }, order: { type: Sequelize.INTEGER, allowNull: false }, invoice_number: { type: Sequelize.STRING(100), allowNull: false }, billing_document: { type: Sequelize.STRING(100), allowNull: false }, billing_name: { type: Sequelize.STRING(255), allowNull: false }, billing_address: { type: Sequelize.TEXT, allowNull: true }, issued_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }, deleted_at: { type: Sequelize.DATE, allowNull: true } }, { transaction });
			await queryInterface.addIndex('invoices', ['invoice_number'], { unique: true, name: 'idx_invoices_number_uq', where: { deleted_at: null } , transaction });
			await queryInterface.addIndex('invoices', ['order'], { name: 'idx_invoices_order' , transaction });
			await queryInterface.addIndex('invoices', ['billing_document'], { name: 'idx_invoices_billing_document' , transaction });
			await queryInterface.addIndex('invoices', ['issued_at'], { name: 'idx_invoices_issued_at' , transaction });
			await queryInterface.addConstraint('invoices', { fields: ['order'], type: 'foreign key', name: 'fk_invoices_order', references: { table: 'orders', field: 'id' }, onDelete: 'RESTRICT', onUpdate: 'CASCADE' , transaction });
		});
	},

	async down(queryInterface, Sequelize) {
		await queryInterface.dropTable('invoices');
	}
};
