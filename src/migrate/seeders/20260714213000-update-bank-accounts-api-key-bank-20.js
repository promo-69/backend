'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
	async up(queryInterface, Sequelize) {
		await queryInterface.sequelize.query(
			`UPDATE bank_accounts SET api_key = 'Fa968r_g4pVhDdmtvo9OuvIBm0lCluDjyfTSany5SsJOKs7KoKNo-sd4FmdXSLC7' WHERE bank = 20;`
		);
		await queryInterface.sequelize.query(
			`UPDATE banks SET api_url = 'https://cineflix-banky.onrender.com/api' WHERE id = 20;`
		);
	},

	async down(queryInterface, Sequelize) {
		await queryInterface.sequelize.query(
			`UPDATE bank_accounts SET api_key = NULL WHERE bank = 20;`
		);
		await queryInterface.sequelize.query(
			`UPDATE banks SET api_url = NULL WHERE id = 20;`
		);
	}
};
