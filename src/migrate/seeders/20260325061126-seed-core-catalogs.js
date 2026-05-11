'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {

        // 2. OPERATION TYPES (Movimientos de inventario, finanzas y fidelidad)
        await queryInterface.bulkInsert(
            'operation_types',
            [
                { id: 1, description: 'Suma de Puntos (Compra)', is_increment: true},
                { id: 2, description: 'Resta de Puntos (Canje)', is_increment: false},
                { id: 3, description: 'Entrada de Inventario (Compra a Proveedor)', is_increment: true},
                { id: 4, description: 'Salida de Inventario (Venta)', is_increment: false},
                { id: 5, description: 'Ajuste de Inventario (Merma/Dañado)', is_increment: false},
            ],
            {},
        );

        // 3. GENDERS (Identidad humana)
        await queryInterface.bulkInsert(
            'genders',
            [
                { id: 1, description: 'Masculino'},
                { id: 2, description: 'Femenino'},
                { id: 3, description: 'No Binario'},
                { id: 4, description: 'Prefiero no decirlo'},
            ],
            {},
        );

        // 4. USER TYPES (Clasificación de cuentas de acceso)
        await queryInterface.bulkInsert(
            'user_types',
            [
                { id: 1, description: 'Empleado'},
                { id: 2, description: 'Cliente'},
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
                    code: 'CINEMA_MANAGER',
                    name: 'Gerente',
                    description: 'Administración, supervisión de personal y reportes de un cine específico.',
                },
                {
                    id: 3,
                    code: 'CASHIER',
                    name: 'Cajero',
                    description: 'Atención al cliente, venta de boletos en taquilla y productos de confitería.',
                },
                {
                    id: 4,
                    code: 'USHER',
                    name: 'Acomodador',
                    description: 'Control de acceso a las salas, validación de boletos y asistencia al cliente.',
                },
            ],
            {},
        );
        await queryInterface.bulkInsert(
            'permission_types',
            [
                { id: 1, code: 'VIEW', description: 'Acceso a alguna vista'},
                { id: 2, code: 'CRUD', description: 'Crear, leer, actualizar y eliminar registros'},
                { id: 3, code: 'FEATURE', description: 'Acceso a ejecutar alguna funcionalidad'},
            ],
            {},
        );
        await queryInterface.bulkInsert(
            'actions',
            [
                { id: 1, code: 'CREATE', description: 'Crear registros'},
                { id: 2, code: 'READ', description: 'Leer registros'},
                { id: 3, code: 'UPDATE', description: 'Actualizar registros'},
                { id: 4, code: 'DELETE', description: 'Eliminar registros'},
                { id: 5, code: 'DO', description: 'Ejecutar alguna funcionalidad'},
                { id: 6, code: 'ACCESS', description: 'Acceso a alguna vista'},
            ],
            {},
        );
        await queryInterface.bulkInsert(
            'resources',
            [
                { id: 1, code: 'DASHBOARD', description: 'Dashboard principal'},
                { id: 2, code: 'MOVIES', description: 'Películas'},
                { id: 3, code: 'SHOWTIMES', description: 'Horarios'},
                { id: 4, code: 'TICKETS', description: 'Boletos'},
                { id: 5, code: 'CONCESSIONS', description: 'Confitería'},
                { id: 6, code: 'REWARDS', description: 'Recompensas'},
                { id: 7, code: 'USERS', description: 'Usuarios'},
                { id: 8, code: 'ROLES', description: 'Roles'},
                { id: 9, code: 'PERMISSIONS', description: 'Permisos'},
                { id: 10, code: 'ACTIONS', description: 'Acciones'},
                { id: 11, code: 'RESOURCES', description: 'Recursos'},
                { id: 12, code: 'JOB_POSITIONS', description: 'Cargos'},
                { id: 13, code: 'OPERATION_TYPES', description: 'Tipos de operación'},
                { id: 14, code: 'GENDERS', description: 'Géneros'},
                { id: 15, code: 'USER_TYPES', description: 'Tipos de usuario'},
                { id: 16, code: 'STATUSES', description: 'Estados'},
                { id: 17, code: 'CINEMAS', description: 'Cines'},
                { id: 18, code: 'ROOMS', description: 'Salas'},
                { id: 19, code: 'SEATS', description: 'Asientos'},
                { id: 20, code: 'PRICES', description: 'Precios'},
                { id: 21, code: 'DISCOUNTS', description: 'Descuentos'},
                { id: 22, code: 'TAXES', description: 'Impuestos'},
                { id: 23, code: 'PAYMENT_METHODS', description: 'Métodos de pago'},
                { id: 24, code: 'REWARDS_CATALOG', description: 'Catálogo de recompensas'},
                { id: 25, code: 'REWARDS_REDEEMED', description: 'Recompensas canjeadas'},
                { id: 26, code: 'REWARDS_POINTS', description: 'Puntos de recompensa'},
                { id: 27, code: 'REWARDS_POINTS_HISTORY', description: 'Historial de puntos de recompensa'},
            ],
            {},
        );

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
    },

    async down(queryInterface, Sequelize) {
        // Reversión en orden inverso
        await queryInterface.bulkDelete('job_positions', null, {});
        await queryInterface.bulkDelete('roles', null, {});
        await queryInterface.bulkDelete('user_types', null, {});
        await queryInterface.bulkDelete('genders', null, {});
        await queryInterface.bulkDelete('operation_types', null, {});
    },
};
