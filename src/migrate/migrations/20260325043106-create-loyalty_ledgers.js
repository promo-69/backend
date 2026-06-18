'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
	async up(queryInterface, Sequelize) {
		await queryInterface.sequelize.transaction(async (transaction) => {
			await queryInterface.createTable('loyalty_ledgers', { id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false }, customer: { type: Sequelize.INTEGER, allowNull: false }, order: { type: Sequelize.INTEGER, allowNull: true }, operation_type: { type: Sequelize.INTEGER, allowNull: false }, points: { type: Sequelize.INTEGER, allowNull: false }, points_balance: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 }, remarks: { allowNull: true, type: Sequelize.TEXT }, created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }, deleted_at: { type: Sequelize.DATE, allowNull: true } }, { transaction });
			await queryInterface.addIndex('loyalty_ledgers', ['customer', 'operation_type'], { name: 'idx_loyalty_customer_op' , transaction });
			await queryInterface.addConstraint('loyalty_ledgers', { fields: ['customer'], type: 'foreign key', name: 'fk_loyalty_ledgers_customer', references: { table: 'customers', field: 'id' }, onDelete: 'RESTRICT', onUpdate: 'CASCADE' , transaction });
			await queryInterface.addConstraint('loyalty_ledgers', { fields: ['order'], type: 'foreign key', name: 'fk_loyalty_ledgers_order', references: { table: 'orders', field: 'id' }, onDelete: 'RESTRICT', onUpdate: 'CASCADE' , transaction });
			await queryInterface.addConstraint('loyalty_ledgers', { fields: ['operation_type'], type: 'foreign key', name: 'fk_loyalty_ledgers_operation_type', references: { table: 'operation_types', field: 'id' }, onDelete: 'RESTRICT', onUpdate: 'CASCADE' , transaction });
			await queryInterface.sequelize.query(`ALTER TABLE loyalty_ledgers ADD CONSTRAINT chk_loyalty_ledgers_pts CHECK (points > 0);`, { transaction });
		});
	},

	async down(queryInterface, Sequelize) {
		await queryInterface.dropTable('loyalty_ledgers');
	}
};
