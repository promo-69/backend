'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
	async up(queryInterface, Sequelize) {
		await queryInterface.bulkInsert(
			'invoice_sequences',
			[
				{
					cinema: 1,
					prefix: 'SCC',
					current_value: 1,
				},
				{
					cinema: 2,
					prefix: 'CPL',
					current_value: 1,
				},
			],
			{},
		);
	},

	async down(queryInterface, Sequelize) {
		await queryInterface.bulkDelete('invoice_sequences', null, {});
	},
};
