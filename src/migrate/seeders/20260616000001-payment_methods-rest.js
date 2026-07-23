'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
	async up(queryInterface, Sequelize) {
		await queryInterface.bulkInsert(
			'payment_methods',
			[
				{ description: 'Transferencia Nacional', requires_reference: true },
			],
			{},
		);
	},

	async down(queryInterface, Sequelize) {
		await queryInterface.bulkDelete('payment_methods', null, {});
	},
};
