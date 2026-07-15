'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
	async up(queryInterface) {
		await queryInterface.sequelize.query(
			`UPDATE bank_accounts SET payment_details = '[{"label":"Número de Cuenta","value":"02013464119733167401","name":"account_number"},{"label":"Documento","value":"J-123456789","name":"identity_document"}]'
			WHERE bank = 20 AND currency = 2 AND payment_method = 2;`
		);
	},

	async down(queryInterface) {
		await queryInterface.sequelize.query(
			`UPDATE bank_accounts SET payment_details = '[]' WHERE bank = 20 AND currency = 2 AND payment_method = 2;`
		);
	}
};
