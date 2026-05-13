'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
	async up(queryInterface, Sequelize) {
		await queryInterface.sequelize.query(`CALL public.update_serial_sequence();`);
	},
	async down(queryInterface, Sequelize) {},
};
