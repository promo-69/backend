'use strict';

/**
 * Método de pago "Boleto en Blanco" (id 6): permite liquidar un ticket en taquilla
 * usando un vale de boleto en blanco (Fase B). No mueve dinero; cubre el total del ticket.
 *
 * @type {import('sequelize-cli').Migration}
 */
module.exports = {
	async up(queryInterface, Sequelize) {
		await queryInterface.bulkInsert(
			'payment_methods',
			[{ id: 6, description: 'Boleto en Blanco', requires_reference: false }],
			{ ignoreDuplicates: true },
		);
		// Asegura que la secuencia de la PK no colisione con el id fijo insertado
		await queryInterface.sequelize.query(
			`SELECT setval(pg_get_serial_sequence('payment_methods', 'id'), (SELECT MAX(id) FROM payment_methods));`,
		);
	},

	async down(queryInterface, Sequelize) {
		await queryInterface.bulkDelete('payment_methods', { id: 6 }, {});
	},
};
