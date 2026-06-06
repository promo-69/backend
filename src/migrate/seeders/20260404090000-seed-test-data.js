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
                    room_type: 1,
                    name: 'Sala 1',
                    grid_rows: 5,
                    grid_columns: 8,
                },
                {
                    id: 2,
                    cinema: 1,
                    room_type: 1,
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

        // --- MÓDULO 5: CARTELERA ---
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
                {
                    id: 3,
                    room: 2,
                    start_time: '2026-06-02 14:00:00',
                    end_time: '2026-06-02 18:00:00',
                    booking_type: 3,
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
                    language: 1,
                    currency: 1,
                    price: 12.5,
                    earned_loyalty_points: 25,
                },
                {
                    id: 2,
                    booking: 2,
                    movie: 2,
                    projection_type: 1,
                    language: 1,
                    currency: 1,
                    price: 10.0,
                    earned_loyalty_points: 20,
                },
            ],
            {},
        );

        // --- MÓDULO 2: PERSONAS, CLIENTES Y EMPLEADOS ---
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
                    level_progress_points: 281,
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
                    job_position: 1, // Gerente General
                    cinema: 1,
                    start_date: '2026-04-01',
                    end_date: null,
                    salary_base: 5000.0,
                },
            ],
            {},
        );

        await queryInterface.bulkInsert(
            'movie_user_subscriptions',
            [{ id: 1, customer: 1, movie: 1, is_notified: true }],
            {},
        );

        const mariaPassword = await bcrypt.hash('Password123.', 10);
        const adminPassword = await bcrypt.hash(process.env.SUPER_ADMIN_PASSWORD || 'Admin123456*', 10);

        await queryInterface.bulkInsert(
            'users',
            [
                {
                    id: 1,
                    person: 1,
                    user_type: 2, // Cliente
                    role: null,
                    email: 'maria.perez@example.com',
                    password: mariaPassword,
                    signup_code: await bcrypt.hash(nanoid(20), 10),
                    signup_verified_at: new Date(),
                },
                {
                    id: 2,
                    person: 2,
                    user_type: 1, // Empleado
                    role: 1, // SUPER_ADMIN
                    email: process.env.SUPER_ADMIN_EMAIL || 'admin@cineflix.com',
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
                    currency: 2, // Bolívares (VES)
                    rate: 36.5,
                    user: 2, // Empleado (Admin)
                },
            ],
            {},
        );

        await queryInterface.bulkInsert(
            'price_modifiers',
            [
                {
                    id: 1,
                    description: 'Descuento Estudiantil (20% en boletería)',
                    operation_type: 2, // Resta (descuento)
                    is_percentage: true,
                    value: 20.0,
                    modifier_scope: 1, // Boletería
                    audience_category: 4, // Estudiante
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
            ],
            {},
        );

        await queryInterface.bulkInsert(
            'combo_products',
            [
                { id: 1, combo: 1, product: 1, quantity: 1 },
                { id: 2, combo: 1, product: 2, quantity: 2 },
            ],
            {},
        );

        await queryInterface.bulkInsert(
            'inventories',
            [
                { id: 1, cinema: 1, product: 1, minimum_stock: 10 },
                { id: 2, cinema: 1, product: 2, minimum_stock: 20 },
                { id: 3, cinema: 1, product: 3, minimum_stock: 5 },
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
            ],
            {},
        );

        // --- MÓDULO 7: ORDENES, DETALLES, TICKETS Y PAGOS ---

        // ORDEN 1: Alquiler de Sala Privada (Aceptado y Pagado)
        // Cotización: Alquiler espacio ($150) + Catering de 10 Cotufas ($50) y 20 Refrescos ($50) = Subtotal $250.00
        // Impuestos: IVA 16% = $40.00. Total = $290.00
        await queryInterface.bulkInsert(
            'orders',
            [
                {
                    id: 1,
                    customer: 1,
                    employee: 1, // Admin aprobador
                    cinema: 1,
                    system_base_currency: 1, // USD
                    subtotal_base_currency: 250.0,
                    tax_amount_base_currency: 40.0,
                    total_amount_base_currency: 290.0,
                    generated_points: 250,
                    order_status: 2, // Pagada / Completada
                },
            ],
            {},
        );

        await queryInterface.bulkInsert(
            'order_taxes',
            [
                {
                    id: 1,
                    order: 1,
                    tax: 1, // IVA 16%
                    applied_rate: 16.0,
                    tax_amount_base_currency: 40.0,
                },
            ],
            {},
        );

        await queryInterface.bulkInsert(
            'order_payments',
            [
                {
                    id: 1,
                    order: 1,
                    payment_method: 1, // Efectivo Divisas
                    amount: 290.0,
                    quoted_exchange_rate: 1, // Tasa USD base = 1
                    reference_number: 'PAY-RENTAL-001',
                    is_approved: true,
                },
            ],
            {},
        );

        // ORDEN 2: Compra Regular en Taquilla
        // Detalle: 2 boletos para Showtime 1. Boleto 1 aplica Descuento Estudiantil ($12.50 -> $10.00). Boleto 2 normal ($12.50)
        // Adicional: 1 Combo Pareja ($8.50)
        // Subtotal = $10.00 + $12.50 + $8.50 = $31.00
        // Impuestos: IVA 16% = $4.96. Total = $35.96
        await queryInterface.bulkInsert(
            'orders',
            [
                {
                    id: 2,
                    customer: 1,
                    employee: null, // Compra web por la cliente
                    cinema: 1,
                    system_base_currency: 1, // USD
                    subtotal_base_currency: 31.0,
                    tax_amount_base_currency: 4.96,
                    total_amount_base_currency: 35.96,
                    generated_points: 31,
                    order_status: 2, // Pagada
                },
            ],
            {},
        );

        await queryInterface.bulkInsert(
            'order_taxes',
            [
                {
                    id: 2,
                    order: 2,
                    tax: 1, // IVA 16%
                    applied_rate: 16.0,
                    tax_amount_base_currency: 4.96,
                },
            ],
            {},
        );

        await queryInterface.bulkInsert(
            'order_lines',
            [
                {
                    id: 1,
                    order: 2,
                    line_type: 2, // Combo
                    product: null,
                    combo: 1,
                    quantity: 1,
                    original_unit_price: 8.5,
                    unit_price: 8.5,
                    quoted_exchange_rate: 1,
                },
            ],
            {},
        );

        await queryInterface.bulkInsert(
            'tickets',
            [
                {
                    id: 1,
                    order: 2,
                    booking: 1, // Showtime 1 booking
                    seat: 1,
                    original_price: 12.5,
                    price: 10.0, // Con descuento
                    quoted_exchange_rate: 1,
                    validation_time: null,
                },
                {
                    id: 2,
                    order: 2,
                    booking: 1,
                    seat: 2,
                    original_price: 12.5,
                    price: 12.5, // Normal
                    quoted_exchange_rate: 1,
                    validation_time: null,
                },
            ],
            {},
        );

        // Aplicar el descuento polimórfico al Ticket 1
        await queryInterface.bulkInsert(
            'applied_price_modifiers',
            [
                {
                    id: 1,
                    price_modifier: 1, // Descuento Estudiantil
                    order: null,
                    ticket: 1,
                    order_line: null,
                    rental_request: null,
                    rental_catering: null,
                    applied_amount_base_currency: 2.5, // Se descontaron 2.50$
                },
            ],
            {},
        );

        await queryInterface.bulkInsert(
            'order_payments',
            [
                {
                    id: 2,
                    order: 2,
                    payment_method: 3, // Punto de venta
                    amount: 35.96,
                    quoted_exchange_rate: 1,
                    reference_number: 'PAY-TICKET-001',
                    is_approved: true,
                },
            ],
            {},
        );

        // --- MÓDULO 2 Y FIDELIDAD: REGISTRO EN EL LIBRO DE FIDELIDAD (LEDGER) ---
        await queryInterface.bulkInsert(
            'loyalty_ledgers',
            [
                {
                    id: 1,
                    customer: 1,
                    order: 1,
                    operation_type: 1, // Suma de puntos por compra
                    points: 250,
                    points_balance: 250,
                },
                {
                    id: 2,
                    customer: 1,
                    order: 2,
                    operation_type: 1, // Suma de puntos por compra
                    points: 31,
                    points_balance: 281, // Balance total actual del cliente (250 + 31 = 281)
                },
            ],
            {},
        );
    },

    async down(queryInterface, Sequelize) {
        // Reversión estricta en orden inverso de dependencias de claves foráneas
        await queryInterface.bulkDelete('loyalty_ledgers', null, {});
        await queryInterface.bulkDelete('applied_price_modifiers', null, {});
        await queryInterface.bulkDelete('order_payments', null, {});
        await queryInterface.bulkDelete('tickets', null, {});
        await queryInterface.bulkDelete('order_lines', null, {});
        await queryInterface.bulkDelete('order_taxes', null, {});
        await queryInterface.bulkDelete('orders', null, {});
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
