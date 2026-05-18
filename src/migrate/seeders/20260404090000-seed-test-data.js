'use strict';

const bcrypt = require('bcryptjs');
const { nanoid } = require('nanoid');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
	async up(queryInterface, Sequelize) {
		await queryInterface.bulkInsert(
			'cinemas',
			[
				{
					id: 1,
					name: 'Cine Central',
					address: 'Av. Principal 123, Centro',
					phone: '+58 212-555-0101',
					opening_time: '10:00:00',
					closing_time: '23:30:00',
				},
				{
					id: 2,
					name: 'Cine Plaza',
					address: 'Calle Las Palmas 45, Urb. Las Américas',
					phone: '+58 212-555-0202',
					opening_time: '11:00:00',
					closing_time: '22:30:00',
				},
			],
			{},
		);

		await queryInterface.bulkInsert(
			'rooms',
			[
				{
					id: 1,
					cinema: 1,
					name: 'Sala 1',
					grid_rows: 5,
					grid_columns: 8,
				},
				{
					id: 2,
					cinema: 1,
					name: 'Sala 2',
					grid_rows: 4,
					grid_columns: 6,
				},
			],
			{},
		);

		await queryInterface.bulkInsert(
			'room_projection_types',
			[
				{ id: 1, room: 1, projection_type: 1 },
				{ id: 2, room: 1, projection_type: 2 },
				{ id: 3, room: 2, projection_type: 1 },
			],
			{},
		);

		await queryInterface.bulkInsert(
			'seats',
			[
				{
					id: 1,
					room: 1,
					row_identifier: 'A',
					column_number: 1,
					seat_category: 1,
					seat_condition: 1,
				},
				{
					id: 2,
					room: 1,
					row_identifier: 'A',
					column_number: 2,
					seat_category: 1,
					seat_condition: 1,
				},
				{
					id: 3,
					room: 1,
					row_identifier: 'A',
					column_number: 3,
					seat_category: 2,
					seat_condition: 1,
				},
				{
					id: 4,
					room: 2,
					row_identifier: 'A',
					column_number: 1,
					seat_category: 1,
					seat_condition: 1,
				},
				{
					id: 5,
					room: 2,
					row_identifier: 'A',
					column_number: 2,
					seat_category: 2,
					seat_condition: 1,
				},
			],
			{},
		);

		await queryInterface.bulkInsert(
			'movies',
			[
				{
					id: 1,
					title: 'La Aventura del Cine',
					duration_minutes: 110,
					age_classification: 1,
					lifecycle_state: 2,
					synopsis: 'Una historia sobre el amor por las salas de cine y la magia de la pantalla grande.',
					trailer_url: 'https://example.com/trailer/la-aventura-del-cine',
					release_date: '2026-05-01',
				},
				{
					id: 2,
					title: 'Fantasía Urbana',
					duration_minutes: 95,
					age_classification: 2,
					lifecycle_state: 3,
					synopsis: 'Aventuras fantásticas en el corazón de la ciudad, con mucho humor y corazón.',
					trailer_url: 'https://example.com/trailer/fantasia-urbana',
					release_date: '2026-04-15',
				},
			],
			{},
		);

		await queryInterface.bulkInsert(
			'movie_genres',
			[
				{ id: 1, movie: 1, genre: 1 },
				{ id: 2, movie: 1, genre: 6 },
				{ id: 3, movie: 2, genre: 4 },
				{ id: 4, movie: 2, genre: 3 },
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

		await queryInterface.bulkInsert(
			'room_bookings',
			[
				{
					id: 1,
					room: 1,
					start_time: '2026-05-01 18:00:00',
					end_time: '2026-05-01 20:00:00',
					booking_type: 1,
				},
				{
					id: 2,
					room: 2,
					start_time: '2026-05-01 20:30:00',
					end_time: '2026-05-01 22:05:00',
					booking_type: 1,
				},
			],
			{},
		);

		await queryInterface.bulkInsert(
			'showtimes',
			[
				{
					id: 1,
					booking: 1,
					movie: 1,
					projection_type: 1,
					currency: 1,
					price: 12.5,
					earned_loyalty_points: 25,
				},
				{
					id: 2,
					booking: 2,
					movie: 2,
					projection_type: 1,
					currency: 1,
					price: 10.0,
					earned_loyalty_points: 20,
				},
			],
			{},
		);

		await queryInterface.bulkInsert(
			'people',
			[
				{
					id: 1,
					document_number: 'V-12345678',
					first_name: 'María',
					last_name: 'Pérez',
					gender: 2,
					phone_number: '+58 424-123-4567',
					personal_email: 'maria.perez@example.com',
					birth_date: '1992-08-10',
				},
				{
					id: 2,
					document_number: 'V-87654321',
					first_name: 'Admin',
					last_name: 'Super',
					gender: 1,
					phone_number: '+58 212-555-0000',
					personal_email: 'admin.super@cineflix.com',
					birth_date: '1985-01-01',
				},
			],
			{},
		);

		await queryInterface.bulkInsert(
			'customers',
			[
				{
					id: 1,
					person: 1,
					loyalty_level: 1,
					level_progress_points: 80,
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
					person: 2,
					employee_code: 'ADM001',
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
					job_position: 1,
					cinema: 1,
					start_date: '2026-04-01',
					end_date: null,
					salary_base: 5000.0,
				},
			],
			{},
		);

		await queryInterface.bulkInsert(
			'movie_subscriptions',
			[{ id: 1, customer: 1, movie: 1, is_notified: true }],
			{},
		);

		const mariaPassword = await bcrypt.hash('password123.', 10);
		const adminPassword = await bcrypt.hash(process.env.SUPER_ADMIN_PASSWORD, 10);

		await queryInterface.bulkInsert(
			'users',
			[
				{
					id: 1,
					person: 1,
					user_type: 2,
					role: null,
					email: 'maria.perez@example.com',
					password: mariaPassword,
					signup_code: await bcrypt.hash(nanoid(20), 10),
					signup_verified_at: new Date(),
				},
				{
					id: 2,
					person: 2,
					user_type: 1,
					role: 1,
					email: process.env.SUPER_ADMIN_EMAIL,
					password: adminPassword,
					signup_code: await bcrypt.hash(nanoid(20), 10),
					signup_verified_at: new Date(),
				},
			],
			{},
		);
	},

	async down(queryInterface, Sequelize) {
		await queryInterface.bulkDelete('users', null, {});
		await queryInterface.bulkDelete('employee_positions', null, {});
		await queryInterface.bulkDelete('employees', null, {});
		await queryInterface.bulkDelete('movie_subscriptions', null, {});
		await queryInterface.bulkDelete('customers', null, {});
		await queryInterface.bulkDelete('people', null, {});
		await queryInterface.bulkDelete('room_events', null, {});
		await queryInterface.bulkDelete('showtimes', null, {});
		await queryInterface.bulkDelete('room_bookings', null, {});
		await queryInterface.bulkDelete('booking_types', null, {});
		await queryInterface.bulkDelete('movie_genres', null, {});
		await queryInterface.bulkDelete('movies', null, {});
		await queryInterface.bulkDelete('seats', null, {});
		await queryInterface.bulkDelete('room_projection_types', null, {});
		await queryInterface.bulkDelete('rooms', null, {});
		await queryInterface.bulkDelete('cinemas', null, {});
	},
};
