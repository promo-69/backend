'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
	async up(queryInterface, Sequelize) {
		// --- MÓDULO 3: INFRAESTRUCTURA ---
		await queryInterface.bulkInsert(
			'room_types',
			[
				{ id: 1, description: 'Tradicional' },
				{ id: 2, description: 'Premium' },
				{ id: 3, description: 'VIP' },
				{ id: 4, description: 'IMAX' },
			],
			{},
		);

		await queryInterface.bulkInsert(
			'projection_types',
			[
				{ id: 1, description: '2D Digital' },
				{ id: 2, description: '3D Digital' },
				{ id: 3, description: 'IMAX' },
				{ id: 4, description: '4DX' },
			],
			{},
		);

		await queryInterface.bulkInsert(
			'seat_categories',
			[
				{ id: 1, description: 'General' },
				{ id: 2, description: 'Preferencial / VIP' },
				{ id: 3, description: 'Discapacitados (Silla de Ruedas)' },
			],
			{},
		);

		await queryInterface.bulkInsert(
			'seat_conditions',
			[
				{ id: 1, description: 'Operativa' },
				{ id: 2, description: 'Dañada / Fuera de Servicio' },
				{ id: 3, description: 'En Mantenimiento' },
			],
			{},
		);

		// --- MÓDULO 4: ECONOMÍA ---
		await queryInterface.bulkInsert(
			'currencies',
			[
				{
					id: 1,
					code: 'USD',
					description: 'Dólar Estadounidense',
					symbol: '$',
					is_base_currency: true,
				},
				{
					id: 2,
					code: 'VES',
					description: 'Bolívar Soberano',
					symbol: 'Bs.',
					is_base_currency: false,
				},
			],
			{},
		);

		// --- MÓDULO 5: CARTELERA Y PRECIOS ---
		await queryInterface.bulkInsert(
			'genres',
			[
				{ id: 1, description: 'Acción' },
				{ id: 2, description: 'Comedia' },
				{ id: 3, description: 'Drama' },
				{ id: 4, description: 'Ciencia Ficción' },
				{ id: 5, description: 'Terror / Suspenso' },
				{ id: 6, description: 'Animación / Infantil' },
			],
			{},
		);

		await queryInterface.bulkInsert(
			'age_classifications',
			[
				{ id: 1, description: 'A (Todo Público)' },
				{ id: 2, description: 'B (Mayores de 12 años)' },
				{ id: 3, description: 'C (Mayores de 15 años)' },
				{ id: 4, description: 'D (Exclusivo Mayores de 18 años)' },
			],
			{},
		);

		await queryInterface.bulkInsert(
			'movie_lifecycle_states',
			[
				{ id: 1, description: 'Próximamente' },
				{ id: 2, description: 'En Cartelera (Estreno)' },
				{ id: 3, description: 'En Cartelera (Regular)' },
				{ id: 4, description: 'Últimos Días' },
				{ id: 5, description: 'Fuera de Cartelera' },
			],
			{},
		);

		await queryInterface.bulkInsert(
			'audience_categories',
			[
				{ id: 1, description: 'Adulto' },
				{ id: 2, description: 'Niño' },
				{ id: 3, description: 'Tercera Edad' },
				{ id: 4, description: 'Estudiante' },
			],
			{},
		);

		await queryInterface.bulkInsert(
			'week_days',
			[
				{ id: 1, description: 'Lunes', day_number: 1 },
				{ id: 2, description: 'Martes', day_number: 2 },
				{ id: 3, description: 'Miércoles', day_number: 3 },
				{ id: 4, description: 'Jueves', day_number: 4 },
				{ id: 5, description: 'Viernes', day_number: 5 },
				{ id: 6, description: 'Sábado', day_number: 6 },
				{ id: 7, description: 'Domingo', day_number: 7 },
			],
			{},
		);

		await queryInterface.bulkInsert(
			'modifier_scopes',
			[
				{ id: 1, description: 'Boletería (Tickets)' },
				{ id: 2, description: 'Dulcería (Productos/Combos)' },
				{ id: 3, description: 'Global (Orden Completa)' },
			],
			{},
		);

		await queryInterface.bulkInsert(
			'languages',
			[
				{ id: 1, description: 'Español' },
				{ id: 2, description: 'Inglés' },
				{ id: 3, description: 'Portugués' },
				{ id: 4, description: 'Francés' },
				{ id: 5, description: 'Italiano' },
			],
			{},
		);

		await queryInterface.bulkInsert(
			'booking_types',
			[
				{ id: 1, description: 'Película' },
				{ id: 2, description: 'Evento Alternativo' },
				{ id: 3, description: 'Alquiler Privado' },
			],
			{},
		);

		// --- GAMIFICACIÓN: Niveles Minerales ---
		await queryInterface.bulkInsert(
			'loyalty_levels',
			[
				{ id: 1, name: 'Bronce', required_points: 300 },
				{ id: 2, name: 'Plata', required_points: 900 },
				{ id: 3, name: 'Oro', required_points: 2100 },
				{ id: 4, name: 'VIP', required_points: 4500 },
			],
			{},
		);

		// --- MÓDULO 6: INVENTARIO ---
		await queryInterface.bulkInsert(
			'product_categories',
			[
				{ id: 1, description: 'Bebidas (Refrescos, Agua, Jugos)' },
				{ id: 2, description: 'Snacks (Cotufas, Tequeños, Nachos)' },
				{ id: 3, description: 'Chocolatería y Dulces' },
				{ id: 4, description: 'Promocionales (Vasos, Coleccionables)' },
			],
			{},
		);

		// --- MÓDULO 7: TRANSACCIONES Y PAGOS ---
		await queryInterface.bulkInsert(
			'order_statuses',
			[
				{ id: 1, description: 'Pendiente de Pago' },
				{ id: 2, description: 'Pagada / Completada' },
				{ id: 3, description: 'Cancelada' },
			],
			{},
		);

		await queryInterface.bulkInsert(
			'payment_methods',
			[
				{ id: 1, description: 'Efectivo Divisas', requires_reference: false },
				{ id: 2, description: 'Efectivo Bolívares', requires_reference: false },
				{ id: 3, description: 'Punto de Venta (Débito)', requires_reference: true },
				{ id: 4, description: 'Pago Móvil', requires_reference: true },
				{ id: 5, description: 'Transferencia Divisas', requires_reference: true },
				{ id: 6, description: 'Puntos de Fidelidad', requires_reference: false },
			],
			{},
		);

		await queryInterface.bulkInsert(
			'line_types',
			[
				{ id: 1, description: 'Producto Individual' },
				{ id: 2, description: 'Combo Armado' },
			],
			{},
		);

		await queryInterface.sequelize.query(`CALL update_serial_sequence();`);
	},

	async down(queryInterface, Sequelize) {
		const tablesToClean = [
			'line_types',
			'payment_methods',
			'order_statuses',
			'product_categories',
			'loyalty_levels',
			'modifier_scopes',
			'week_days',
			'booking_types',
			'audience_categories',
			'movie_lifecycle_states',
			'age_classifications',
			'languages',
			'genres',
			'currencies',
			'seat_conditions',
			'seat_categories',
			'room_types',
			'projection_types',
		];

		for (const table of tablesToClean) {
			await queryInterface.bulkDelete(table, null, {});
		}
	},
};
