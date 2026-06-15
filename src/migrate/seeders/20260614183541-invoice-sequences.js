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
				{
					cinema: 3,
					prefix: 'SCO',
					current_value: 1,
				},
				{
					cinema: 4,
					prefix: 'SCA',
					current_value: 1,
				},
				{
					cinema: 5,
					prefix: 'SSE',
					current_value: 1,
				},
				{
					cinema: 6,
					prefix: 'CPV',
					current_value: 1,
				},
				{
					cinema: 7,
					prefix: 'PSU',
					current_value: 1,
				},
				{
					cinema: 8,
					prefix: 'SP2',
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
