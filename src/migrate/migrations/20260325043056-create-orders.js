'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
	async up(queryInterface, Sequelize) {
		await queryInterface.sequelize.transaction(async (transaction) => {
			await queryInterface.createTable('orders', { id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false }, customer: { type: Sequelize.INTEGER, allowNull: false }, employee: { type: Sequelize.INTEGER, allowNull: true }, cinema: { type: Sequelize.INTEGER, allowNull: false }, system_base_currency: { type: Sequelize.INTEGER, allowNull: false }, subtotal_base_currency: { type: Sequelize.DECIMAL(10, 2), allowNull: false }, tax_amount_base_currency: { type: Sequelize.DECIMAL(10, 2), allowNull: false }, total_amount_base_currency: { type: Sequelize.DECIMAL(10, 2), allowNull: false }, generated_points: { type: Sequelize.INTEGER, allowNull: false }, order_status: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 1 }, remarks: { type: Sequelize.TEXT, allowNull: true }, qr_code: { type: Sequelize.STRING(500), allowNull: true }, tickets_validated_at: { type: Sequelize.DATE, allowNull: true }, concessions_validated_at: { type: Sequelize.DATE, allowNull: true }, created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }, deleted_at: { type: Sequelize.DATE, allowNull: true } }, { transaction });
			await queryInterface.addIndex('orders', ['customer'], { name: 'idx_orders_customer' , transaction });
			await queryInterface.addIndex('orders', ['cinema', 'created_at'], { name: 'idx_orders_cinema_date' , transaction });
			await queryInterface.addConstraint('orders', { fields: ['customer'], type: 'foreign key', name: 'fk_orders_customer', references: { table: 'customers', field: 'id' }, onDelete: 'RESTRICT', onUpdate: 'CASCADE' , transaction });
			await queryInterface.addConstraint('orders', { fields: ['employee'], type: 'foreign key', name: 'fk_orders_employee', references: { table: 'employees', field: 'id' }, onDelete: 'RESTRICT', onUpdate: 'CASCADE' , transaction });
			await queryInterface.addConstraint('orders', { fields: ['cinema'], type: 'foreign key', name: 'fk_orders_cinema', references: { table: 'cinemas', field: 'id' }, onDelete: 'RESTRICT', onUpdate: 'CASCADE' , transaction });
			await queryInterface.addConstraint('orders', { fields: ['order_status'], type: 'foreign key', name: 'fk_orders_order_status', references: { table: 'order_statuses', field: 'id' }, onDelete: 'RESTRICT', onUpdate: 'CASCADE' , transaction });
			await queryInterface.addConstraint('orders', { fields: ['system_base_currency'], type: 'foreign key', name: 'fk_orders_system_base_currency', references: { table: 'currencies', field: 'id' }, onDelete: 'RESTRICT', onUpdate: 'CASCADE' , transaction });
			await queryInterface.sequelize.query(`ALTER TABLE orders ADD CONSTRAINT chk_orders_amounts CHECK (subtotal_base_currency >= 0 AND tax_amount_base_currency >= 0 AND total_amount_base_currency >= 0 AND generated_points >= 0);`, { transaction });
		});
	},

	async down(queryInterface, Sequelize) {
		await queryInterface.dropTable('orders');
	}
};
