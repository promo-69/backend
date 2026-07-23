'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
	async up(queryInterface, Sequelize) {
		const banks = [
			{ code: '0102', name: 'Banco de Venezuela' },
			{ code: '0104', name: 'Venezolano de Crédito' },
			{ code: '0105', name: 'Mercantil Banco' },
			{ code: '0108', name: 'BBVA Provincial' },
			{ code: '0114', name: 'Bancaribe' },
			{ code: '0115', name: 'Exterior' },
			{ code: '0128', name: 'Banco Caroní' },
			{ code: '0138', name: 'Banco Plaza' },
			{ code: '0151', name: 'BFC Banco Fondo Común' },
			{ code: '0156', name: '100% Banco' },
			{ code: '0163', name: 'Banco del Tesoro' },
			{ code: '0168', name: 'Bancrecer' },
			{ code: '0169', name: 'R4 Banco' },
			{ code: '0171', name: 'Banco Activo' },
			{ code: '0172', name: 'Bancamiga' },
			{ code: '0174', name: 'Banplus' },
			{ code: '0175', name: 'Banco Bicentenario' },
			{ code: '0191', name: 'BNC (Banco Nacional de Crédito)' },
			{ code: '0001', name: 'Banco Central de Venezuela (BCV)' },
			{ code: '0201', name: 'Banky', api_url: 'https://cineflix-banky.onrender.com/api/external/transactions' }
		];

		await queryInterface.bulkInsert('banks', banks, {});
	},

	async down(queryInterface, Sequelize) {
		await queryInterface.bulkDelete('banks', null, {});
	}
};
