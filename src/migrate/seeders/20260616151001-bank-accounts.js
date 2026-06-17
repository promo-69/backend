'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
	async up(queryInterface, Sequelize) {
		// Obtener el ID del banco "Banky"
		const [banks] = await queryInterface.sequelize.query(`SELECT id FROM banks WHERE code = '0201' LIMIT 1;`);
		if (!banks.length) {
			console.log('No se encontró el banco Banky, saltando semilla de cuentas bancarias.');
			return;
		}
		const bankId = banks[0].id;

		// Obtener el ID de la moneda VES
		const [currencies] = await queryInterface.sequelize.query(`SELECT id FROM currencies WHERE code = 'VES' LIMIT 1;`);
		if (!currencies.length) {
			console.log('No se encontró la moneda VES, saltando semilla de cuentas bancarias.');
			return;
		}
		const currencyId = currencies[0].id;

		const accounts = [
			{
				bank: bankId,
				currency: currencyId,
				payment_method: 4,
				payment_details: JSON.stringify({
					phone_number: "04121234567",
					identity_document: "J-123456789"
				})
			},
			{
				bank: bankId,
				currency: currencyId,
				payment_method: 3,
				payment_details: JSON.stringify({
					account_number: "02013464119733167401",
					identity_document: "J-123456789"
				})
			}
		];

		await queryInterface.bulkInsert('bank_accounts', accounts, {});
	},

	async down(queryInterface, Sequelize) {
		await queryInterface.bulkDelete('bank_accounts', null, {});
	}
};
