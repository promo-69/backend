'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
	async up(queryInterface, Sequelize) {
		// Obtener el ID del banco "Banky"
		const [banks] = await queryInterface.sequelize.query(`SELECT id FROM banks WHERE code = '0201' LIMIT 1;`);
		if (!banks.length) {
			console.log('No se encontró el banco Banky, saltando semilla de cuenta bancaria para POS.');
			return;
		}
		const bankId = banks[0].id;

		// Obtener el ID de la moneda VES
		const [currencies] = await queryInterface.sequelize.query(`SELECT id FROM currencies WHERE code = 'VES' LIMIT 1;`);
		if (!currencies.length) {
			console.log('No se encontró la moneda VES, saltando semilla de cuenta bancaria para POS.');
			return;
		}
		const currencyId = currencies[0].id;

		const accounts = [
			{
				bank: bankId,
				currency: currencyId,
				payment_method: 2, // 2 = Punto de Venta (POS)
				api_key: 'Fa968r_g4pVhDdmtvo9OuvIBm0lCluDjyfTSany5SsJOKs7KoKNo-sd4FmdXSLC7',
				payment_details: JSON.stringify({
					account_number: {
						label: "Número de Cuenta",
						value: "02013464119733167401"
					},
					identity_document: {
						label: "Documento",
						value: "J-123456789"
					}
				})
			}
		];

		await queryInterface.bulkInsert('bank_accounts', accounts, {});
	},

	async down(queryInterface, Sequelize) {
		const [banks] = await queryInterface.sequelize.query(`SELECT id FROM banks WHERE code = '0201' LIMIT 1;`);
		if (!banks.length) return;
		const bankId = banks[0].id;

		const [currencies] = await queryInterface.sequelize.query(`SELECT id FROM currencies WHERE code = 'VES' LIMIT 1;`);
		if (!currencies.length) return;
		const currencyId = currencies[0].id;

		await queryInterface.bulkDelete('bank_accounts', {
			bank: bankId,
			currency: currencyId,
			payment_method: 2
		}, {});
	}
};
