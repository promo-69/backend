'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
	async up(queryInterface, Sequelize) {
		await queryInterface.sequelize.transaction(async (transaction) => {
			await queryInterface.removeIndex('order_payments', 'idx_order_payments_ref_uq', { transaction });
		});
	},

	async down(queryInterface, Sequelize) {
		await queryInterface.sequelize.transaction(async (transaction) => {
			await queryInterface.addIndex('order_payments', ['reference_number'], {
				unique: true,
				name: 'idx_order_payments_ref_uq',
				where: { deleted_at: null },
				transaction
			});
		});
	}
};
