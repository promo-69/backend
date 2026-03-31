'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        // --- MÓDULO 3: INFRAESTRUCTURA ---
        await queryInterface.bulkInsert(
            'projection_types',
            [
                { id: 1, description: '2D Digital', status: 1 },
                { id: 2, description: '3D Digital', status: 1 },
                { id: 3, description: 'IMAX', status: 1 },
                { id: 4, description: '4DX', status: 1 },
            ],
            {},
        );

        await queryInterface.bulkInsert(
            'seat_categories',
            [
                { id: 1, description: 'General', status: 1 },
                { id: 2, description: 'Preferencial / VIP', status: 1 },
                { id: 3, description: 'Discapacitados (Silla de Ruedas)', status: 1 },
            ],
            {},
        );

        await queryInterface.bulkInsert(
            'seat_conditions',
            [
                { id: 1, description: 'Operativa', status: 1 },
                { id: 2, description: 'Dañada / Fuera de Servicio', status: 1 },
                { id: 3, description: 'En Mantenimiento', status: 1 },
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
                    status: 1,
                },
                {
                    id: 2,
                    code: 'VES',
                    description: 'Bolívar Soberano',
                    symbol: 'Bs.',
                    is_base_currency: false,
                    status: 1,
                },
            ],
            {},
        );

        // --- MÓDULO 5: CARTELERA Y PRECIOS ---
        await queryInterface.bulkInsert(
            'genres',
            [
                { id: 1, description: 'Acción', status: 1 },
                { id: 2, description: 'Comedia', status: 1 },
                { id: 3, description: 'Drama', status: 1 },
                { id: 4, description: 'Ciencia Ficción', status: 1 },
                { id: 5, description: 'Terror / Suspenso', status: 1 },
                { id: 6, description: 'Animación / Infantil', status: 1 },
            ],
            {},
        );

        await queryInterface.bulkInsert(
            'age_classifications',
            [
                { id: 1, description: 'A (Todo Público)', status: 1 },
                { id: 2, description: 'B (Mayores de 12 años)', status: 1 },
                { id: 3, description: 'C (Mayores de 15 años)', status: 1 },
                { id: 4, description: 'D (Exclusivo Mayores de 18 años)', status: 1 },
            ],
            {},
        );

        await queryInterface.bulkInsert(
            'movie_lifecycle_states',
            [
                { id: 1, description: 'Próximamente', status: 1 },
                { id: 2, description: 'En Cartelera (Estreno)', status: 1 },
                { id: 3, description: 'En Cartelera (Regular)', status: 1 },
                { id: 4, description: 'Últimos Días', status: 1 },
                { id: 5, description: 'Fuera de Cartelera', status: 1 },
            ],
            {},
        );

        await queryInterface.bulkInsert(
            'audience_categories',
            [
                { id: 1, description: 'Adulto', status: 1 },
                { id: 2, description: 'Niño', status: 1 },
                { id: 3, description: 'Tercera Edad', status: 1 },
                { id: 4, description: 'Estudiante', status: 1 },
            ],
            {},
        );

        await queryInterface.bulkInsert(
            'week_days',
            [
                { id: 1, description: 'Lunes', day_number: 1, status: 1 },
                { id: 2, description: 'Martes', day_number: 2, status: 1 },
                { id: 3, description: 'Miércoles', day_number: 3, status: 1 },
                { id: 4, description: 'Jueves', day_number: 4, status: 1 },
                { id: 5, description: 'Viernes', day_number: 5, status: 1 },
                { id: 6, description: 'Sábado', day_number: 6, status: 1 },
                { id: 7, description: 'Domingo', day_number: 7, status: 1 },
            ],
            {},
        );

        await queryInterface.bulkInsert(
            'modifier_scopes',
            [
                { id: 1, description: 'Boletería (Tickets)', status: 1 },
                { id: 2, description: 'Dulcería (Productos/Combos)', status: 1 },
                { id: 3, description: 'Global (Orden Completa)', status: 1 },
            ],
            {},
        );

        // --- GAMIFICACIÓN: Niveles Minerales ---
        await queryInterface.bulkInsert(
            'loyalty_levels',
            [
                { id: 1, name: 'Cuarzo', required_points: 300, status: 1 },
                { id: 2, name: 'Ámbar', required_points: 900, status: 1 },
                { id: 3, name: 'Jade', required_points: 2100, status: 1 },
                { id: 4, name: 'Ópalo', required_points: 4500, status: 1 },
                { id: 5, name: 'Topacio', required_points: 9300, status: 1 },
                { id: 6, name: 'Zafiro', required_points: 18900, status: 1 },
                { id: 7, name: 'Esmeralda', required_points: 38100, status: 1 },
                { id: 8, name: 'Rubí', required_points: 76500, status: 1 },
                { id: 9, name: 'Diamante', required_points: 153300, status: 1 },
                { id: 10, name: 'Obsidiana', required_points: 306900, status: 1 },
            ],
            {},
        );

        // --- MÓDULO 6: INVENTARIO ---
        await queryInterface.bulkInsert(
            'product_categories',
            [
                { id: 1, description: 'Bebidas (Refrescos, Agua, Jugos)', status: 1 },
                { id: 2, description: 'Snacks (Cotufas, Tequeños, Nachos)', status: 1 },
                { id: 3, description: 'Chocolatería y Dulces', status: 1 },
                { id: 4, description: 'Promocionales (Vasos, Coleccionables)', status: 1 },
            ],
            {},
        );

        // --- MÓDULO 7: TRANSACCIONES Y PAGOS ---
        await queryInterface.bulkInsert(
            'order_statuses',
            [
                { id: 1, description: 'Pendiente de Pago', status: 1 },
                { id: 2, description: 'Pagada / Completada', status: 1 },
                { id: 3, description: 'Cancelada', status: 1 },
                { id: 4, description: 'Reembolsada', status: 1 },
            ],
            {},
        );

        await queryInterface.bulkInsert(
            'payment_methods',
            [
                { id: 1, description: 'Efectivo Divisas', requires_reference: false, status: 1 },
                { id: 2, description: 'Efectivo Bolívares', requires_reference: false, status: 1 },
                { id: 3, description: 'Punto de Venta (Débito)', requires_reference: true, status: 1 },
                { id: 4, description: 'Pago Móvil', requires_reference: true, status: 1 },
                { id: 5, description: 'Transferencia Divisas', requires_reference: true, status: 1 },
                { id: 6, description: 'Puntos de Fidelidad', requires_reference: false, status: 1 },
            ],
            {},
        );

        await queryInterface.bulkInsert(
            'line_types',
            [
                { id: 1, description: 'Producto Individual', status: 1 },
                { id: 2, description: 'Combo Armado', status: 1 },
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
            'audience_categories',
            'movie_lifecycle_states',
            'age_classifications',
            'genres',
            'currencies',
            'seat_conditions',
            'seat_categories',
            'projection_types',
        ];

        for (const table of tablesToClean) {
            await queryInterface.bulkDelete(table, null, {});
        }
    },
};
