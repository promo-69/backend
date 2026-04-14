'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        // 1. STATUSES (El núcleo de todo el sistema)
        await queryInterface.bulkInsert(
            'statuses',
            [
                { id: 1, description: 'Activo' },
                { id: 2, description: 'Inactivo' },
                { id: 3, description: 'Suspendido' },
                { id: 4, description: 'Eliminado' },
            ],
            {},
        );

        // 2. OPERATION TYPES (Movimientos de inventario, finanzas y fidelidad)
        await queryInterface.bulkInsert(
            'operation_types',
            [
                { id: 1, description: 'Suma de Puntos (Compra)', is_increment: true, status: 1 },
                { id: 2, description: 'Resta de Puntos (Canje)', is_increment: false, status: 1 },
                { id: 3, description: 'Entrada de Inventario (Compra a Proveedor)', is_increment: true, status: 1 },
                { id: 4, description: 'Salida de Inventario (Venta)', is_increment: false, status: 1 },
                { id: 5, description: 'Ajuste de Inventario (Merma/Dañado)', is_increment: false, status: 1 },
            ],
            {},
        );

        // 3. GENDERS (Identidad humana)
        await queryInterface.bulkInsert(
            'genders',
            [
                { id: 1, description: 'Masculino', status: 1 },
                { id: 2, description: 'Femenino', status: 1 },
                { id: 3, description: 'No Binario', status: 1 },
                { id: 4, description: 'Prefiero no decirlo', status: 1 },
            ],
            {},
        );

        // 4. USER TYPES (Clasificación de cuentas de acceso)
        await queryInterface.bulkInsert(
            'user_types',
            [
                { id: 1, description: 'Empleado', status: 1 },
                { id: 2, description: 'Cliente', status: 1 },
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
                    status: 1,
                },
                {
                    id: 2,
                    code: 'CINEMA_MANAGER',
                    name: 'Gerente',
                    description: 'Administración, supervisión de personal y reportes de un cine específico.',
                    status: 1,
                },
                {
                    id: 3,
                    code: 'CASHIER',
                    name: 'Cajero',
                    description: 'Atención al cliente, venta de boletos en taquilla y productos de confitería.',
                    status: 1,
                },
                {
                    id: 4,
                    code: 'USHER',
                    name: 'Acomodador',
                    description: 'Control de acceso a las salas, validación de boletos y asistencia al cliente.',
                    status: 1,
                },
            ],
            {},
        );
        await queryInterface.bulkInsert(
            'permission_types',
            [
                { id: 1, code: 'VIEW', description: 'Acceso a alguna vista', status: 1 },
                { id: 2, code: 'CRUD', description: 'Crear, leer, actualizar y eliminar registros', status: 1 },
                { id: 3, code: 'FEATURE', description: 'Acceso a ejecutar alguna funcionalidad', status: 1 },
            ],
            {},
        );
        await queryInterface.bulkInsert(
            'actions',
            [
                { id: 1, code: 'CREATE', description: 'Crear registros', status: 1 },
                { id: 2, code: 'READ', description: 'Leer registros', status: 1 },
                { id: 3, code: 'UPDATE', description: 'Actualizar registros', status: 1 },
                { id: 4, code: 'DELETE', description: 'Eliminar registros', status: 1 },
                { id: 5, code: 'DO', description: 'Ejecutar alguna funcionalidad', status: 1 },
                { id: 6, code: 'ACCESS', description: 'Acceso a alguna vista', status: 1 },
            ],
            {},
        );
        await queryInterface.bulkInsert(
            'resources',
            [
                { id: 1, code: 'DASHBOARD', description: 'Dashboard principal', status: 1 },
                { id: 2, code: 'MOVIES', description: 'Películas', status: 1 },
                { id: 3, code: 'SHOWTIMES', description: 'Horarios', status: 1 },
                { id: 4, code: 'TICKETS', description: 'Boletos', status: 1 },
                { id: 5, code: 'CONCESSIONS', description: 'Confitería', status: 1 },
                { id: 6, code: 'REWARDS', description: 'Recompensas', status: 1 },
                { id: 7, code: 'USERS', description: 'Usuarios', status: 1 },
                { id: 8, code: 'ROLES', description: 'Roles', status: 1 },
                { id: 9, code: 'PERMISSIONS', description: 'Permisos', status: 1 },
                { id: 10, code: 'ACTIONS', description: 'Acciones', status: 1 },
                { id: 11, code: 'RESOURCES', description: 'Recursos', status: 1 },
                { id: 12, code: 'JOB_POSITIONS', description: 'Cargos', status: 1 },
                { id: 13, code: 'OPERATION_TYPES', description: 'Tipos de operación', status: 1 },
                { id: 14, code: 'GENDERS', description: 'Géneros', status: 1 },
                { id: 15, code: 'USER_TYPES', description: 'Tipos de usuario', status: 1 },
                { id: 16, code: 'STATUSES', description: 'Estados', status: 1 },
                { id: 17, code: 'CINEMAS', description: 'Cines', status: 1 },
                { id: 18, code: 'ROOMS', description: 'Salas', status: 1 },
                { id: 19, code: 'SEATS', description: 'Asientos', status: 1 },
                { id: 20, code: 'PRICES', description: 'Precios', status: 1 },
                { id: 21, code: 'DISCOUNTS', description: 'Descuentos', status: 1 },
                { id: 22, code: 'TAXES', description: 'Impuestos', status: 1 },
                { id: 23, code: 'PAYMENT_METHODS', description: 'Métodos de pago', status: 1 },
                { id: 24, code: 'REWARDS_CATALOG', description: 'Catálogo de recompensas', status: 1 },
                { id: 25, code: 'REWARDS_REDEEMED', description: 'Recompensas canjeadas', status: 1 },
                { id: 26, code: 'REWARDS_POINTS', description: 'Puntos de recompensa', status: 1 },
                { id: 27, code: 'REWARDS_POINTS_HISTORY', description: 'Historial de puntos de recompensa', status: 1 },
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
                    status: 1,
                },
                {
                    id: 2,
                    title: 'Supervisor de Turno',
                    description: 'Supervisa operaciones de caja y piso',
                    is_pensionable: true,
                    status: 1,
                },
                {
                    id: 3,
                    title: 'Cajero Junior',
                    description: 'Atención al cliente en taquilla',
                    is_pensionable: false,
                    status: 1,
                },
                {
                    id: 4,
                    title: 'Operador de Dulcería',
                    description: 'Manejo de alimentos y bebidas',
                    is_pensionable: false,
                    status: 1,
                },
                {
                    id: 5,
                    title: 'Personal de Mantenimiento',
                    description: 'Limpieza de salas y pasillos',
                    is_pensionable: true,
                    status: 1,
                },
                {
                    id: 6,
                    title: 'Jubilado',
                    description: 'Personal retirado con beneficios',
                    is_pensionable: false,
                    status: 1,
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
        await queryInterface.bulkDelete('statuses', null, {});
    },
};
