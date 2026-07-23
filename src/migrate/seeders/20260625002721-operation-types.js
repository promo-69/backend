'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
	async up(queryInterface, Sequelize) {
		await queryInterface.bulkInsert(
			'operation_types',
			[
				{
					description: 'Incremento',
					is_increment: true,
				},
				{
					description: 'Decremento',
					is_increment: false,
				},
			],
			{},
		);
	},

	async down(queryInterface, Sequelize) {
		await queryInterface.bulkDelete('operation_types', null, {});
	},
};
