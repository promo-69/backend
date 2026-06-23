'use strict';

const bcrypt = require('bcryptjs');
const { nanoid } = require('nanoid');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
	async up(queryInterface, Sequelize) {
		// --- MÓDULO 2: SUCURSALES ---
		await queryInterface.bulkInsert(
			'cinemas',
			[
				{
					id: 1,
					name: 'Sambil Caracas',
					address: 'Avenida Libertador con Calle Línea, Avenida El Parque y Avenida Tachira. Centro Comercial Sambil Caracas, Nivel Entretenimiento. Caracas (Municipio Chacao), Estado Miranda / Distrito Capital.',
					phone: '+58 212-555-0101',
					opening_time: '10:00:00',
					closing_time: '23:30:00',
				},
				{
					id: 2,
					name: 'Sambil Barquisimeto',
					address: 'Avenida Venezuela con Avenida Argimiro Bracamonte y Avenida Críspulo Benítez. Centro Comercial Sambil Barquisimeto, Locales L-76/77. Barquisimeto, Estado Lara.',
					phone: '+58 212-555-0202',
					opening_time: '11:00:00',
					closing_time: '22:30:00',
				},
			],
			{},
		);

		// --- MÓDULO 5: CARTELERA ---
		await queryInterface.bulkInsert(
			'movies',
			[
				{
                    id: 1,
                    title: 'Michael',
                    duration_minutes: 127,
                    age_classification: 1,
                    lifecycle_state: 3,
                    synopsis: 'Película biográfica sobre el rey del pop, Michael Jackson. Retratará al cantante desde sus inicios hasta su trágico fallecimiento en 2009. ',
					banner_url: 'https://ik.imagekit.io/cineflix/cineflix/movies/banners/michael-jackson-banner.png',
					poster_url: 'https://ik.imagekit.io/cineflix/cineflix/movies/posters/michale-jackson-poster.png?updatedAt=1782218752518',
                    trailer_url: 'https://www.youtube.com/watch?v=o1HQSh6zZ8s',
                    release_date: '2026-06-02',
                },
				{
                    id: 2,
                    title: 'Toy Story 5',
                    duration_minutes: 105,
                    age_classification: 1,
                    lifecycle_state: 3,
                    synopsis: 'Se centra en la amenaza de la tecnología moderna para los juguetes tradicionales, con una nueva protagonista...',
					banner_url: 'https://ik.imagekit.io/cineflix/cineflix/movies/banners/toy-story-5-banner.png',
					poster_url: 'https://ik.imagekit.io/cineflix/cineflix/movies/posters/toy-story-5-poster.png?updatedAt=1782218752500',
                    trailer_url: 'https://example.com/trailer/fantasia-urbana',
                    release_date: '2026-06-15',
                },
			],
			{},
		);

		await queryInterface.bulkInsert(
			'movie_genres',
			[
				{ id: 1, movie: 1, genre: 7 },
				{ id: 2, movie: 1, genre: 8 },
				{ id: 3, movie: 2, genre: 4 },
				{ id: 4, movie: 2, genre: 6 },
				{ id: 5, movie: 2, genre: 10 },
			],
			{},
		);

		// --- MÓDULO 2: PERSONAS, CLIENTES Y EMPLEADOS ---
		await queryInterface.bulkInsert(
			'people',
			[
				{
					id: 1,
					document_number: 'V-00000000',
					first_name: 'Admin',
					last_name: 'Super',
					gender: 1,
					phone_number: '+58 212-555-0000',
					personal_email: 'super.admin@cineflix.com',
					birth_date: '1985-01-01',
				},
				{
					id: 2,
					document_number: 'V-12345678',
					first_name: 'María',
					last_name: 'Pérez',
					gender: 2,
					phone_number: '+58 424-123-4567',
					personal_email: 'maria.perez@example.com',
					birth_date: '1992-08-10',
				},
				{
					id: 3,
					document_number: 'V-00000001',
					first_name: 'Gerente',
					last_name: 'General',
					gender: 1,
					phone_number: '+58 212-555-1111',
					personal_email: 'gerente.general@cineflix.com',
					birth_date: '1985-01-01',
				},
				{
					id: 4,
					document_number: 'V-00000002',
					first_name: 'Gerente',
					last_name: 'Sambil Bqto',
					gender: 1,
					phone_number: '+58 212-555-0001',
					personal_email: 'sambil.bqto@cineflix.com',
					birth_date: '1985-01-02',
				},
				{
					id: 5,
					document_number: 'V-00000003',
					first_name: 'Gerente',
					last_name: 'Sambil Ccs',
					gender: 1,
					phone_number: '+58 212-555-0002',
					personal_email: 'sambil.ccs@cineflix.com',
					birth_date: '1985-01-02',
				},
			],
			{},
		);

		await queryInterface.bulkInsert(
			'customers',
			[
				{
					id: 1,
					person: 2,
					loyalty_level: 1,
					level_progress_points: 200,
					registration_date: '2026-04-01 12:00:00',
				},
			],
			{},
		);

		await queryInterface.bulkInsert(
			'employees',
			[
				{
					id: 1,
					person: 1,
					employee_code: 'SUPADM',
				},
				{
					id: 2,
					person: 3,
					employee_code: 'GERGEN',
				},
				{
					id: 3,
					person: 4,
					employee_code: 'GERBTO',
				},
				{
					id: 4,
					person: 5,
					employee_code: 'GERCCS',
				},
			],
			{},
		);

		await queryInterface.bulkInsert(
			'employee_positions',
			[
				{
					id: 1,
					employee: 1,
					job_position: 1, // SUPER_ADMIN
					cinema: 1,
					start_date: '2026-04-01',
					end_date: null,
					salary_base: 1.0,
				},
				{
					id: 2,
					employee: 2,
					job_position: 1, // Gerente General
					cinema: 1,
					start_date: '2026-04-01',
					end_date: null,
					salary_base: 25000.0,
				},
				{
					id: 3,
					employee: 3,
					job_position: 2, // Gerente de Sucursal
					cinema: 1,
					start_date: '2026-04-01',
					end_date: null,
					salary_base: 5000.0,
				},
				{
					id: 4,
					employee: 4,
					job_position: 2, // Gerente de Sucursal
					cinema: 2,
					start_date: '2026-04-01',
					end_date: null,
					salary_base: 5000.0,
				},
			],
			{},
		);

		const mariaPassword = await bcrypt.hash('Maria123456*', 10);
		const adminPassword = await bcrypt.hash(process.env.SUPER_ADMIN_PASSWORD, 10);

		await queryInterface.bulkInsert(
			'users',
			[
				{
					id: 1,
					person: 1,
					user_type: 1, // Empleado
					role: 1, // SUPER_ADMIN
					email: process.env.SUPER_ADMIN_EMAIL,
					password: adminPassword,
					signup_code: await bcrypt.hash(nanoid(20), 10),
					signup_verified_at: new Date(),
				},
				{
					id: 2,
					person: 2,
					user_type: 2, // Cliente
					role: null,
					email: 'maria.perez@example.com',
					password: mariaPassword,
					signup_code: await bcrypt.hash(nanoid(20), 10),
					signup_verified_at: new Date(),
				},
				{
					id: 3,
					person: 3,
					user_type: 1, // Empleado
					role: 2,
					email: 'gerente.general@cineflix.com',
					password: adminPassword,
					signup_code: await bcrypt.hash(nanoid(20), 10),
					signup_verified_at: new Date(),
				},
				{
					id: 4,
					person: 4,
					user_type: 1, // Empleado
					role: 3,
					email: 'sambil.bqto@cineflix.com',
					password: adminPassword,
					signup_code: await bcrypt.hash(nanoid(20), 10),
					signup_verified_at: new Date(),
				},
				{
					id: 5,
					person: 5,
					user_type: 1, // Empleado
					role: 3,
					email: 'sambil.ccs@cineflix.com',
					password: adminPassword,
					signup_code: await bcrypt.hash(nanoid(20), 10),
					signup_verified_at: new Date(),
				},
			],
			{},
		);

		// --- MÓDULO 4 Y 7: ECONOMÍA, IMPUESTOS Y REGLAS ---
		await queryInterface.bulkInsert(
			'taxes',
			[
				{
					id: 1,
					name: 'IVA 16%',
					rate: 16.0,
					is_percentage: true,
				},
			],
			{},
		);

		await queryInterface.bulkInsert(
			'tax_rules',
			[
				{
					id: 1,
					tax: 1,
					tax_scope: 3, // Global
				},
			],
			{},
		);

		await queryInterface.bulkInsert(
			'exchange_rates',
			[
				{
					id: 1,
					currency: 1, // USD
					rate: 600,
					user: 1, // Empleado (Admin)
				},
				{
					id: 2,
					currency: 2, // Bolívares (VES)
					rate: 1.0,
					user: 1,
				},
				{
					id: 3,
					currency: 3, // Cinepuntos
					rate: 0.5,
					user: 1,
				},
			],
			{},
		);

		// --- MÓDULO 6: INVENTARIO, PRODUCTOS Y COMBOS ---
		await queryInterface.bulkInsert(
			'products',
			[
				{
					id: 1,
					name: 'Cotufas Grandes',
					sku: 'PROD-POPCORN-LG',
					product_category: 2, // Snacks
					currency: 1, // USD
					price: 5.0,
					earned_loyalty_points: 10,
				},
				{
					id: 2,
					name: 'Refresco Mediano',
					sku: 'PROD-SODA-MD',
					product_category: 1, // Bebidas
					currency: 1, // USD
					price: 2.5,
					earned_loyalty_points: 5,
				},
				{
					id: 3,
					name: 'Chocolate Extremo',
					sku: 'PROD-CHOCO-EXT',
					product_category: 3, // Chocolatería y Dulces
					currency: 1, // USD
					price: 3.0,
					earned_loyalty_points: 6,
				},
				{
					id: 4,
					name: 'Nachos con Queso',
					sku: 'PROD-NACHO-CHZ',
					product_category: 2, // Snacks
					currency: 1, // USD
					price: 4.5,
					earned_loyalty_points: 9,
				},
				{
					id: 5,
					name: 'Tequeños',
					sku: 'PROD-TEQ-001',
					product_category: 2, // Snacks
					currency: 1, // USD
					price: 5.5,
					earned_loyalty_points: 11,
				},
				{
					id: 6,
					name: 'Agua Mineral',
					sku: 'PROD-WTR-SM',
					product_category: 1, // Bebidas
					currency: 1, // USD
					price: 1.5,
					earned_loyalty_points: 3,
				},
				{
					id: 7,
					name: 'Refresco Grande',
					sku: 'PROD-SODA-LG',
					product_category: 1, // Bebidas
					currency: 1, // USD
					price: 3.5,
					earned_loyalty_points: 7,
				},
				{
					id: 8,
					name: 'Cotufas Pequeñas',
					sku: 'PROD-POPCORN-SM',
					product_category: 2, // Snacks
					currency: 1, // USD
					price: 3.0,
					earned_loyalty_points: 6,
				},
			],
			{},
		);

		await queryInterface.bulkInsert(
			'combos',
			[
				{
					id: 1,
					cinema: 1,
					name: 'Combo Pareja',
					sku: 'CMB-DUO',
					description: '1 Cotufa Grande + 2 Refrescos Medianos con descuento especial',
					currency: 1, // USD
					price: 8.5,
					earned_loyalty_points: 18,
				},
				{
					id: 2,
					cinema: 1,
					name: 'Combo Familiar',
					sku: 'CMB-FAM',
					description: '2 Cotufas Grandes + 4 Refrescos Medianos',
					currency: 1,
					price: 18.0,
					earned_loyalty_points: 36,
				},
				{
					id: 3,
					cinema: 2,
					name: 'Combo Solitario',
					sku: 'CMB-SOLO',
					description: '1 Cotufas Pequeñas + 1 Refresco Mediano',
					currency: 1,
					price: 5.0,
					earned_loyalty_points: 10,
				},
				{
					id: 4,
					cinema: 2,
					name: 'Combo Snack',
					sku: 'CMB-SNK',
					description: '1 Nachos + 1 Tequeños + 2 Aguas',
					currency: 1,
					price: 12.0,
					earned_loyalty_points: 24,
				},
				{
					id: 5,
					cinema: 1,
					name: 'Combo Premium',
					sku: 'CMB-PRM',
					description: '1 Cotufa Grande + 2 Refrescos Grandes + 1 Chocolate',
					currency: 1,
					price: 14.0,
					earned_loyalty_points: 28,
				},
			],
			{},
		);

		await queryInterface.bulkInsert(
			'combo_products',
			[
				{ id: 1, combo: 1, product: 1, quantity: 1 },
				{ id: 2, combo: 1, product: 2, quantity: 2 },
				{ id: 3, combo: 2, product: 1, quantity: 2 },
				{ id: 4, combo: 2, product: 2, quantity: 4 },
				{ id: 5, combo: 3, product: 8, quantity: 1 },
				{ id: 6, combo: 3, product: 2, quantity: 1 },
				{ id: 7, combo: 4, product: 4, quantity: 1 },
				{ id: 8, combo: 4, product: 5, quantity: 1 },
				{ id: 9, combo: 4, product: 6, quantity: 2 },
				{ id: 10, combo: 5, product: 1, quantity: 1 },
				{ id: 11, combo: 5, product: 7, quantity: 2 },
				{ id: 12, combo: 5, product: 3, quantity: 1 },
			],
			{},
		);

		await queryInterface.bulkInsert(
			'inventories',
			[
				{ id: 1, cinema: 1, product: 1, minimum_stock: 10 },
				{ id: 2, cinema: 1, product: 2, minimum_stock: 20 },
				{ id: 3, cinema: 1, product: 3, minimum_stock: 5 },
				{ id: 4, cinema: 1, product: 4, minimum_stock: 10 },
				{ id: 5, cinema: 1, product: 5, minimum_stock: 10 },
				{ id: 6, cinema: 1, product: 6, minimum_stock: 10 },
				{ id: 7, cinema: 1, product: 7, minimum_stock: 10 },
				{ id: 8, cinema: 1, product: 8, minimum_stock: 10 },
				{ id: 9, cinema: 2, product: 5, minimum_stock: 10 },
				{ id: 10, cinema: 2, product: 6, minimum_stock: 10 },
				{ id: 11, cinema: 2, product: 7, minimum_stock: 10 },
				{ id: 12, cinema: 2, product: 8, minimum_stock: 10 },
			],
			{},
		);

		await queryInterface.bulkInsert(
			'inventory_movements',
			[
				{
					id: 1,
					inventory: 1,
					operation_type: 3, // Entrada
					quantity: 100,
					unit_cost: 1.5,
					currency: 1,
					user: 2,
					resulting_stock: 100,
					resulting_unit_cost_base_currency: 1.5,
					remarks: 'Carga inicial de stock',
				},
				{
					id: 2,
					inventory: 2,
					operation_type: 3, // Entrada
					quantity: 200,
					unit_cost: 0.8,
					currency: 1,
					user: 2,
					resulting_stock: 200,
					resulting_unit_cost_base_currency: 0.8,
					remarks: 'Carga inicial de stock',
				},
				{
					id: 3,
					inventory: 3,
					operation_type: 3, // Entrada
					quantity: 50,
					unit_cost: 1.0,
					currency: 1,
					user: 2,
					resulting_stock: 50,
					resulting_unit_cost_base_currency: 1.0,
					remarks: 'Carga inicial de stock',
				},
				...Array.from({ length: 8 }, (_, i) => ({
					id: 4 + i,
					inventory: 4 + i,
					operation_type: 3,
					quantity: 100,
					unit_cost: 1.0,
					currency: 1,
					user: 2,
					resulting_stock: 100,
					resulting_unit_cost_base_currency: 1.0,
					remarks: 'Carga inicial de stock',
				})),
			],
			{},
		);
	},

	async down(queryInterface, Sequelize) {
		await queryInterface.bulkDelete('inventory_movements', null, {});
		await queryInterface.bulkDelete('inventories', null, {});
		await queryInterface.bulkDelete('combo_products', null, {});
		await queryInterface.bulkDelete('combos', null, {});
		await queryInterface.bulkDelete('products', null, {});
		await queryInterface.bulkDelete('price_modifiers', null, {});
		await queryInterface.bulkDelete('exchange_rates', null, {});
		await queryInterface.bulkDelete('tax_rules', null, {});
		await queryInterface.bulkDelete('taxes', null, {});
		await queryInterface.bulkDelete('users', null, {});
		await queryInterface.bulkDelete('employee_positions', null, {});
		await queryInterface.bulkDelete('employees', null, {});
		await queryInterface.bulkDelete('movie_user_subscriptions', null, {});
		await queryInterface.bulkDelete('customers', null, {});
		await queryInterface.bulkDelete('people', null, {});
		await queryInterface.bulkDelete('showtimes', null, {});
		await queryInterface.bulkDelete('room_bookings', null, {});
		await queryInterface.bulkDelete('seats', null, {});
		await queryInterface.bulkDelete('room_projection_types', null, {});
		await queryInterface.bulkDelete('rooms', null, {});
		await queryInterface.bulkDelete('cinemas', null, {});
	},
};
