'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
	async up(queryInterface, Sequelize) {
		await queryInterface.sequelize.transaction(async (transaction) => {
			// 2. OPERATION TYPES (Movimientos de inventario, finanzas y fidelidad)
			await queryInterface.bulkInsert(
				'operation_types',
				[
					{ id: 1, description: 'Suma de Puntos (Compra)', is_increment: true },
					{ id: 2, description: 'Resta de Puntos (Canje)', is_increment: false },
					{ id: 3, description: 'Entrada de Inventario (Compra a Proveedor)', is_increment: true },
					{ id: 4, description: 'Salida de Inventario (Venta)', is_increment: false },
					{ id: 5, description: 'Ajuste de Inventario (Merma/Dañado)', is_increment: false },
				],
				{},
			);

			// 3. GENDERS (Identidad humana)
			await queryInterface.bulkInsert(
				'genders',
				[
					{ id: 1, description: 'Masculino' },
					{ id: 2, description: 'Femenino' },
					{ id: 3, description: 'Prefiero no decirlo' },
				],
				{},
			);

			// 4. USER TYPES (Clasificación de cuentas de acceso)
			await queryInterface.bulkInsert(
				'user_types',
				[
					{ id: 1, description: 'Empleado' },
					{ id: 2, description: 'Cliente' },
				],
				{},
			);

			// 5. ROLES (Perfiles RBAC)
			await queryInterface.bulkInsert(
				'roles',
				[
					{
						id: 1,
						code: 'SUPER_ADMIN',
						name: 'Administrador',
						description: 'Acceso total y control del sistema en todas las sucursales.',
					},
					{
						id: 2,
						code: 'GENERAL_MANAGER',
						name: 'Gerente General',
						description: 'Administración, supervisión de personal y reportes de todas sucursales.',
					},
					{
						id: 3,
						code: 'CINEMA_MANAGER',
						name: 'Gerente de Sucursal',
						description: 'Administración, supervisión de personal y reportes de un cine específico.',
					},
					{
						id: 4,
						code: 'CASHIER',
						name: 'Operador Nivel 2',
						description:
							'Control de acceso a las salas, validación de boletos, asistencia al cliente, atención al cliente, venta de boletos en taquilla y productos de confitería.',
					},
					{
						id: 5,
						code: 'USHER',
						name: 'Operador Nivel 1',
						description: 'Control de acceso a las salas, validación de boletos y asistencia al cliente.',
					},
				],
				{},
			);
			await queryInterface.bulkInsert(
				'permission_types',
				[
					{ id: 1, code: 'VIEW', description: 'Gestión de apartados visuales' },
					{ id: 2, code: 'CRUD', description: 'Crear, leer, actualizar y eliminar registros' },
					{ id: 3, code: 'FEAT', description: 'Acceso a gestionar funcionalidades' },
				],
				{},
			);
			await queryInterface.bulkInsert(
				'actions',
				[
					{ id: 1, code: 'CREATE', description: 'Crear registros' },
					{ id: 2, code: 'READ', description: 'Leer registros' },
					{ id: 3, code: 'UPDATE', description: 'Actualizar registros' },
					{ id: 4, code: 'DELETE', description: 'Eliminar registros' },
					{ id: 5, code: 'DO', description: 'Ejecutar funcionalidad' },
					{ id: 6, code: 'ACCESS', description: 'Acceder a apartado visual' },
				],
				{},
			);
			await queryInterface.bulkInsert(
				'resources',
				[
					{
						id: 1,
						code: 'MOVIE',
						description: 'Recurso para la gestión de películas',
					},
				],
				{},
			);

			await queryInterface.bulkInsert(
				'permissions',
				[
					{ id: 1, permission_type: 2, resource: 1, action: 3 },
					{ id: 2, permission_type: 2, resource: 1, action: 4 },
					{ id: 3, permission_type: 1, resource: 1, action: 2 },
				],
				{},
			);

			await queryInterface.bulkInsert(
				'role_permissions',
				[
					{ id: 1, role: 2, permission: 1 },
					{ id: 2, role: 2, permission: 2 },
					{ id: 3, role: 1, permission: 3 },
				],
				{},
			);

			await queryInterface.bulkInsert('role_inheritances', [{ id: 1, parent_role: 2, child_role: 1 }], {});

			// 6. JOB POSITIONS (Cargos reales contractuales - RRHH)
			await queryInterface.bulkInsert(
				'job_positions',
				[
					{
						id: 1,
						title: 'Gerente General',
						description: 'Encargado total de la sucursal',
						is_pensionable: true,
					},
					{
						id: 2,
						title: 'Supervisor de Turno',
						description: 'Supervisa operaciones de caja y piso',
						is_pensionable: true,
					},
					{
						id: 3,
						title: 'Cajero Junior',
						description: 'Atención al cliente en taquilla',
						is_pensionable: false,
					},
					{
						id: 4,
						title: 'Operador de Dulcería',
						description: 'Manejo de alimentos y bebidas',
						is_pensionable: false,
					},
					{
						id: 5,
						title: 'Personal de Mantenimiento',
						description: 'Limpieza de salas y pasillos',
						is_pensionable: true,
					},
					{
						id: 6,
						title: 'Jubilado',
						description: 'Personal retirado con beneficios',
						is_pensionable: false,
					},
				],
				{},
			);
		});
	},

	async down(queryInterface, Sequelize) {
		await queryInterface.sequelize.transaction(async (transaction) => {
			// Reversión en orden inverso
			await queryInterface.bulkDelete('job_positions', null, {});
			await queryInterface.bulkDelete('permissions', null, {});
			await queryInterface.bulkDelete('resources', null, {});
			await queryInterface.bulkDelete('actions', null, {});
			await queryInterface.bulkDelete('permission_types', null, {});
			await queryInterface.bulkDelete('roles', null, {});
			await queryInterface.bulkDelete('user_types', null, {});
			await queryInterface.bulkDelete('genders', null, {});
			await queryInterface.bulkDelete('operation_types', null, {});
		});
	},
};
