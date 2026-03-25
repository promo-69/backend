'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        // ==============================================================================
        // 1. STATUSES
        // ==============================================================================
        await queryInterface.bulkInsert(
            'statuses',
            [
                { id: 1, description: 'Activo' },
                { id: 2, description: 'Inactivo' },
            ],
            {},
        );

        // ==============================================================================
        // 2. GENDERS
        // ==============================================================================
        await queryInterface.bulkInsert(
            'genders',
            [
                { id: 1, description: 'Masculino', status: 1 },
                { id: 2, description: 'Femenino', status: 1 },
            ],
            {},
        );

        // ==============================================================================
        // 3. USER TYPES
        // ==============================================================================
        await queryInterface.bulkInsert(
            'user_types',
            [
                { id: 1, description: 'Empleado', status: 1 },
                { id: 2, description: 'Cliente', status: 1 },
            ],
            {},
        );

        // ==============================================================================
        // 4. ROLES
        // ==============================================================================
        await queryInterface.bulkInsert(
            'roles',
            [
                {
                    id: 1,
                    code: 'SUPER_ADMIN',
                    name: 'Administrador Global',
                    description: 'Acceso total y control del sistema en todas las sucursales.',
                    status: 1,
                },
                {
                    id: 2,
                    code: 'CINEMA_MANAGER',
                    name: 'Gerente de Sucursal',
                    description: 'Administración, supervisión de personal y reportes de un cine específico.',
                    status: 1,
                },
                {
                    id: 3,
                    code: 'CASHIER',
                    name: 'Cajero General',
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

        // ==============================================================================
        // 5. OPERATION TYPES (Tipos de movimientos para inventario y puntos de fidelidad)
        // ==============================================================================
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
    },

    async down(queryInterface, Sequelize) {
        // IMPORTANTE: El borrado masivo (rollback) debe hacerse en orden inverso
        // para no violar las llaves foráneas apuntando a `statuses`.
        await queryInterface.bulkDelete('operation_types', null, {});
        await queryInterface.bulkDelete('roles', null, {});
        await queryInterface.bulkDelete('user_types', null, {});
        await queryInterface.bulkDelete('genders', null, {});
        await queryInterface.bulkDelete('statuses', null, {});
    },
};
