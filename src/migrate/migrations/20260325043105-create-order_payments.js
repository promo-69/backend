'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
	async up(queryInterface, Sequelize) {
		await queryInterface.sequelize.transaction(async (transaction) => {
			await queryInterface.createTable('order_payments', { id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false }, order: { type: Sequelize.INTEGER, allowNull: false }, payment_method: { type: Sequelize.INTEGER, allowNull: false }, amount: { type: Sequelize.DECIMAL(10, 2), allowNull: false }, quoted_exchange_rate: { type: Sequelize.INTEGER, allowNull: false }, reference_number: { type: Sequelize.STRING(255), allowNull: true }, is_approved: { type: Sequelize.BOOLEAN, allowNull: false }, created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }, deleted_at: { type: Sequelize.DATE, allowNull: true } }, { transaction });
			await queryInterface.addIndex('order_payments', ['payment_method', 'reference_number'], { unique: true, name: 'idx_order_payments_ref_uq', where: { deleted_at: null } , transaction });
			await queryInterface.addIndex('order_payments', ['order'], { name: 'idx_order_payments_order' , transaction });
			await queryInterface.addIndex('order_payments', ['payment_method', 'created_at'], { name: 'idx_payments_method_date' , transaction });
			await queryInterface.addConstraint('order_payments', { fields: ['order'], type: 'foreign key', name: 'fk_order_payments_order', references: { table: 'orders', field: 'id' }, onDelete: 'RESTRICT', onUpdate: 'CASCADE' , transaction });
			await queryInterface.addConstraint('order_payments', { fields: ['payment_method'], type: 'foreign key', name: 'fk_order_payments_payment_method', references: { table: 'payment_methods', field: 'id' }, onDelete: 'RESTRICT', onUpdate: 'CASCADE' , transaction });
			await queryInterface.addConstraint('order_payments', { fields: ['quoted_exchange_rate'], type: 'foreign key', name: 'fk_order_payments_quoted_exchange_rate', references: { table: 'exchange_rates', field: 'id' }, onDelete: 'RESTRICT', onUpdate: 'CASCADE' , transaction });
			await queryInterface.sequelize.query(`ALTER TABLE order_payments ADD CONSTRAINT chk_order_payments_amt CHECK (amount > 0);`, { transaction });
		});
	},

	async down(queryInterface, Sequelize) {
		await queryInterface.dropTable('order_payments');
	}
};
