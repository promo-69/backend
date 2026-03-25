'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        // ==============================================================================
        // MÓDULO 3: INFRAESTRUCTURA FÍSICA
        // ==============================================================================
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

        // ==============================================================================
        // MÓDULO 4: ECONOMÍA
        // ==============================================================================
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

        // ==============================================================================
        // MÓDULO 5: CARTELERA Y MOTOR DE PRECIOS
        // ==============================================================================
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

        // Basado en el CHECK constraint de la tabla price_modifiers
        await queryInterface.bulkInsert(
            'modifier_scopes',
            [
                { id: 1, description: 'Boletería (Tickets)', status: 1 },
                { id: 2, description: 'Dulcería (Productos/Combos)', status: 1 },
                { id: 3, description: 'Global (Orden Completa)', status: 1 },
            ],
            {},
        );

        // ==============================================================================
        // MÓDULO 6: INVENTARIO Y COMBOS
        // ==============================================================================
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

        // ==============================================================================
        // MÓDULO 7: TRANSACCIONES Y PAGOS
        // ==============================================================================
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
                { id: 1, description: 'Efectivo Dólares', requires_reference: false, status: 1 },
                { id: 2, description: 'Efectivo Bolívares', requires_reference: false, status: 1 },
                { id: 3, description: 'Punto de Venta (Débito)', requires_reference: true, status: 1 },
                { id: 4, description: 'Pago Móvil', requires_reference: true, status: 1 },
                { id: 5, description: 'Zelle', requires_reference: true, status: 1 },
                { id: 6, description: 'Puntos de Fidelidad', requires_reference: false, status: 1 },
            ],
            {},
        );

        // Basado en el CHECK constraint de la tabla order_lines (1 = producto, 2 = combo)
        await queryInterface.bulkInsert(
            'line_types',
            [
                { id: 1, description: 'Producto Individual', status: 1 },
                { id: 2, description: 'Combo Armado', status: 1 },
            ],
            {},
        );
    },

    async down(queryInterface, Sequelize) {
        // Reversión en orden inverso a la inserción del archivo
        await queryInterface.bulkDelete('line_types', null, {});
        await queryInterface.bulkDelete('payment_methods', null, {});
        await queryInterface.bulkDelete('order_statuses', null, {});
        await queryInterface.bulkDelete('product_categories', null, {});
        await queryInterface.bulkDelete('modifier_scopes', null, {});
        await queryInterface.bulkDelete('week_days', null, {});
        await queryInterface.bulkDelete('audience_categories', null, {});
        await queryInterface.bulkDelete('movie_lifecycle_states', null, {});
        await queryInterface.bulkDelete('age_classifications', null, {});
        await queryInterface.bulkDelete('genres', null, {});
        await queryInterface.bulkDelete('currencies', null, {});
        await queryInterface.bulkDelete('seat_conditions', null, {});
        await queryInterface.bulkDelete('seat_categories', null, {});
        await queryInterface.bulkDelete('projection_types', null, {});
    },
};
