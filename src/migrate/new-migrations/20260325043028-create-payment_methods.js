'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
	async up(queryInterface, Sequelize) {
		await queryInterface.sequelize.transaction(async (transaction) => {
			await queryInterface.createTable('payment_methods', { id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false }, description: { type: Sequelize.STRING(255), allowNull: false }, requires_reference: { type: Sequelize.BOOLEAN, allowNull: false }, deleted_at: { type: Sequelize.DATE, allowNull: true } }, { transaction });
			await queryInterface.addIndex('payment_methods', ['description'], { unique: true, name: 'idx_payment_methods_uq', where: { deleted_at: null } , transaction });
		});
	},

	async down(queryInterface, Sequelize) {
		await queryInterface.dropTable('payment_methods');
	}
};
