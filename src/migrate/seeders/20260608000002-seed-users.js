'use strict';

const bcrypt = require('bcryptjs');
const { nanoid } = require('nanoid');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
	async up(queryInterface, Sequelize) {
		await queryInterface.sequelize.query(`CALL public.update_serial_sequence();`);
		await queryInterface.sequelize.transaction(async (transaction) => {
			const password = await bcrypt.hash('Password123*', 10);

			const peopleData = [
				{
					document_number: 'V-10000001',
					first_name: 'Cajero',
					last_name: 'Cine',
					gender: 1,
					personal_email: 'ca@cineflix.com',
					birth_date: '1990-01-01',
				},
				{
					document_number: 'V-10000002',
					first_name: 'Operador',
					last_name: 'Usher',
					gender: 1,
					personal_email: 'us@cineflix.com',
					birth_date: '1990-01-01',
				},
				{
					document_number: 'V-20000001',
					first_name: 'Cliente',
					last_name: 'Uno',
					gender: 1,
					personal_email: 'cl1@cineflix.com',
					birth_date: '2000-01-01',
				},
				{
					document_number: 'V-20000002',
					first_name: 'Cliente',
					last_name: 'Dos',
					gender: 2,
					personal_email: 'cl2@cineflix.com',
					birth_date: '2000-01-01',
				},
			];

			const peopleRecords = [];
			for (const p of peopleData) {
				const [result] = await queryInterface.sequelize.query(
					`INSERT INTO people (document_number, first_name, last_name, gender, personal_email, birth_date)
                     VALUES ('${p.document_number}', '${p.first_name}', '${p.last_name}', ${p.gender}, '${p.personal_email}', '${p.birth_date}')
                     RETURNING id;`,
					{ transaction },
				);
				peopleRecords.push({ ...p, id: result[0].id });
			}

			const empCA = peopleRecords[0].id;
			const empUS = peopleRecords[1].id;
			const cl1 = peopleRecords[2].id;
			const cl2 = peopleRecords[3].id;

			const employeesData = [
				{ person: empCA, employee_code: 'EMP-CA' },
				{ person: empUS, employee_code: 'EMP-US' },
			];

			const employeeRecords = [];
			for (const e of employeesData) {
				const [result] = await queryInterface.sequelize.query(
					`INSERT INTO employees (person, employee_code) VALUES (${e.person}, '${e.employee_code}') RETURNING id;`,
					{ transaction },
				);
				employeeRecords.push({ ...e, id: result[0].id });
			}

			const cinemaId = 1;

			const positionsData = [
				{
					employee: employeeRecords[0].id,
					job_position: 1,
					cinema: cinemaId,
					start_date: '2026-06-01',
					salary_base: 5000,
				},
				{
					employee: employeeRecords[1].id,
					job_position: 2,
					cinema: cinemaId,
					start_date: '2026-06-01',
					salary_base: 3000,
				},
			];

			for (const pos of positionsData) {
				await queryInterface.sequelize.query(
					`INSERT INTO employee_positions (employee, job_position, cinema, start_date, salary_base)
                     VALUES (${pos.employee}, ${pos.job_position}, ${pos.cinema}, '${pos.start_date}', ${pos.salary_base});`,
					{ transaction },
				);
			}

			const usersData = [
				{ person: empCA, user_type: 1, role: 4, email: 'ca@cineflix.com', password },
				{ person: empUS, user_type: 1, role: 5, email: 'us@cineflix.com', password },
				{ person: cl1, user_type: 2, role: null, email: 'cl1@cineflix.com', password },
				{ person: cl2, user_type: 2, role: null, email: 'cl2@cineflix.com', password },
			];

			for (const u of usersData) {
				const roleVal = u.role ? u.role : 'NULL';
				const signupCode = await bcrypt.hash(nanoid(20), 10);
				await queryInterface.sequelize.query(
					`INSERT INTO users (person, user_type, role, email, password, signup_code, signup_verified_at, created_at)
                     VALUES (${u.person}, ${u.user_type}, ${roleVal}, '${u.email}', '${u.password}', '${signupCode}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);`,
					{ transaction },
				);
			}

			const customersData = [
				{ person: cl1, loyalty_level: 1, level_progress_points: 0, registration_date: '2026-06-01 12:00:00' },
				{ person: cl2, loyalty_level: 1, level_progress_points: 0, registration_date: '2026-06-01 12:00:00' },
			];

			for (const c of customersData) {
				await queryInterface.sequelize.query(
					`INSERT INTO customers (person, loyalty_level, level_progress_points, registration_date)
                     VALUES (${c.person}, ${c.loyalty_level}, ${c.level_progress_points}, '${c.registration_date}');`,
					{ transaction },
				);
			}
		});
	},

	async down(queryInterface, Sequelize) {
		await queryInterface.sequelize.query(`
            DELETE FROM customers WHERE person IN (SELECT id FROM people WHERE document_number IN ('V-20000001', 'V-20000002'));
            DELETE FROM users WHERE email IN ('sa@cineflix.com', 'gg@cineflix.com', 'gs@cineflix.com', 'ca@cineflix.com', 'us@cineflix.com', 'cl1@cineflix.com', 'cl2@cineflix.com');
            DELETE FROM employee_positions WHERE employee IN (SELECT id FROM employees WHERE employee_code IN ('EMP-SA', 'EMP-GG', 'EMP-GS', 'EMP-CA', 'EMP-US'));
            DELETE FROM employees WHERE employee_code IN ('EMP-SA', 'EMP-GG', 'EMP-GS', 'EMP-CA', 'EMP-US');
            DELETE FROM people WHERE document_number IN ('V-10000001', 'V-10000002', 'V-10000003', 'V-10000004', 'V-10000005', 'V-20000001', 'V-20000002');
        `);
	},
};
