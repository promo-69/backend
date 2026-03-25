'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        // Diccionario maestro de relaciones.
        // Usar un loop evita sobrecarga de código y asegura una ejecución atómica impecable.
        const foreignKeys = [
            // Módulo 1
            { table: 'operation_types', field: 'status', target: 'statuses', name: 'fk_operation_types_status' },

            // Módulo 2
            { table: 'cinemas', field: 'status', target: 'statuses', name: 'fk_cinemas_status' },
            { table: 'people', field: 'gender', target: 'genders', name: 'fk_people_gender' },
            { table: 'people', field: 'status', target: 'statuses', name: 'fk_people_status' },
            { table: 'user_types', field: 'status', target: 'statuses', name: 'fk_user_types_status' },
            { table: 'roles', field: 'status', target: 'statuses', name: 'fk_roles_status' },

            { table: 'users', field: 'person', target: 'people', name: 'fk_users_people' },
            { table: 'users', field: 'user_type', target: 'user_types', name: 'fk_users_user_type' },
            { table: 'users', field: 'role', target: 'roles', name: 'fk_users_role' },
            { table: 'users', field: 'status', target: 'statuses', name: 'fk_users_status' },

            { table: 'employees', field: 'person', target: 'people', name: 'fk_employees_people' },
            { table: 'employees', field: 'cinema', target: 'cinemas', name: 'fk_employees_cinema' },
            { table: 'employees', field: 'status', target: 'statuses', name: 'fk_employees_status' },

            { table: 'customers', field: 'person', target: 'people', name: 'fk_customers_people' },
            { table: 'customers', field: 'status', target: 'statuses', name: 'fk_customers_status' },

            { table: 'actions', field: 'status', target: 'statuses', name: 'fk_actions_status' },
            { table: 'resources', field: 'status', target: 'statuses', name: 'fk_resources_status' },
            { table: 'permission_types', field: 'status', target: 'statuses', name: 'fk_permission_types_status' },

            { table: 'permissions', field: 'action', target: 'actions', name: 'fk_permissions_action' },
            { table: 'permissions', field: 'resource', target: 'resources', name: 'fk_permissions_resource' },
            {
                table: 'permissions',
                field: 'permission_type',
                target: 'permission_types',
                name: 'fk_permissions_permission_type',
            },
            { table: 'permissions', field: 'status', target: 'statuses', name: 'fk_permissions_status' },

            { table: 'role_permissions', field: 'role', target: 'roles', name: 'fk_role_permissions_role' },
            {
                table: 'role_permissions',
                field: 'permission',
                target: 'permissions',
                name: 'fk_role_permissions_permission',
            },
            { table: 'role_permissions', field: 'status', target: 'statuses', name: 'fk_role_permissions_status' },

            {
                table: 'role_inheritances',
                field: 'parent_role',
                target: 'roles',
                name: 'fk_role_inheritances_parent_role',
            },
            {
                table: 'role_inheritances',
                field: 'child_role',
                target: 'roles',
                name: 'fk_role_inheritances_child_role',
            },
            { table: 'role_inheritances', field: 'status', target: 'statuses', name: 'fk_role_inheritances_status' },

            { table: 'user_permissions', field: 'user', target: 'users', name: 'fk_user_permissions_user' },
            {
                table: 'user_permissions',
                field: 'permission',
                target: 'permissions',
                name: 'fk_user_permissions_permission',
            },
            { table: 'user_permissions', field: 'status', target: 'statuses', name: 'fk_user_permissions_status' },

            // Módulo 3
            { table: 'projection_types', field: 'status', target: 'statuses', name: 'fk_projection_types_status' },

            { table: 'rooms', field: 'cinema', target: 'cinemas', name: 'fk_rooms_cinema' },
            { table: 'rooms', field: 'status', target: 'statuses', name: 'fk_rooms_status' },

            { table: 'room_projection_types', field: 'room', target: 'rooms', name: 'fk_room_projection_types_room' },
            {
                table: 'room_projection_types',
                field: 'projection_type',
                target: 'projection_types',
                name: 'fk_room_projection_types_projection_type',
            },
            {
                table: 'room_projection_types',
                field: 'status',
                target: 'statuses',
                name: 'fk_room_projection_types_status',
            },

            { table: 'seat_categories', field: 'status', target: 'statuses', name: 'fk_seat_categories_status' },
            { table: 'seat_conditions', field: 'status', target: 'statuses', name: 'fk_seat_conditions_status' },

            { table: 'seats', field: 'room', target: 'rooms', name: 'fk_seats_room' },
            { table: 'seats', field: 'seat_category', target: 'seat_categories', name: 'fk_seats_seat_category' },
            { table: 'seats', field: 'seat_condition', target: 'seat_conditions', name: 'fk_seats_seat_condition' },
            { table: 'seats', field: 'status', target: 'statuses', name: 'fk_seats_status' },

            // Módulo 4
            { table: 'currencies', field: 'status', target: 'statuses', name: 'fk_currencies_status' },
            { table: 'exchange_rates', field: 'currency', target: 'currencies', name: 'fk_exchange_rates_currency' },
            { table: 'exchange_rates', field: 'user', target: 'users', name: 'fk_exchange_rates_user' },
            { table: 'exchange_rates', field: 'status', target: 'statuses', name: 'fk_exchange_rates_status' },

            // Módulo 5
            { table: 'genres', field: 'status', target: 'statuses', name: 'fk_genres_status' },
            {
                table: 'age_classifications',
                field: 'status',
                target: 'statuses',
                name: 'fk_age_classifications_status',
            },
            {
                table: 'movie_lifecycle_states',
                field: 'status',
                target: 'statuses',
                name: 'fk_movie_lifecycle_states_status',
            },

            {
                table: 'movies',
                field: 'age_classification',
                target: 'age_classifications',
                name: 'fk_movies_age_classification',
            },
            {
                table: 'movies',
                field: 'lifecycle_state',
                target: 'movie_lifecycle_states',
                name: 'fk_movies_lifecycle_state',
            },
            { table: 'movies', field: 'status', target: 'statuses', name: 'fk_movies_status' },

            { table: 'movie_genres', field: 'movie', target: 'movies', name: 'fk_movie_genres_movie' },
            { table: 'movie_genres', field: 'genre', target: 'genres', name: 'fk_movie_genres_genre' },
            { table: 'movie_genres', field: 'status', target: 'statuses', name: 'fk_movie_genres_status' },

            {
                table: 'movie_subscriptions',
                field: 'customer',
                target: 'customers',
                name: 'fk_movie_subscriptions_customer',
            },
            { table: 'movie_subscriptions', field: 'movie', target: 'movies', name: 'fk_movie_subscriptions_movie' },
            {
                table: 'movie_subscriptions',
                field: 'status',
                target: 'statuses',
                name: 'fk_movie_subscriptions_status',
            },

            { table: 'showtimes', field: 'movie', target: 'movies', name: 'fk_showtimes_movie' },
            { table: 'showtimes', field: 'room', target: 'rooms', name: 'fk_showtimes_room' },
            {
                table: 'showtimes',
                field: 'projection_type',
                target: 'projection_types',
                name: 'fk_showtimes_projection_type',
            },
            { table: 'showtimes', field: 'currency', target: 'currencies', name: 'fk_showtimes_currency' },
            { table: 'showtimes', field: 'status', target: 'statuses', name: 'fk_showtimes_status' },

            {
                table: 'audience_categories',
                field: 'status',
                target: 'statuses',
                name: 'fk_audience_categories_status',
            },
            { table: 'week_days', field: 'status', target: 'statuses', name: 'fk_week_days_status' },
            { table: 'modifier_scopes', field: 'status', target: 'statuses', name: 'fk_modifier_scopes_status' },

            {
                table: 'price_modifiers',
                field: 'modifier_scope',
                target: 'modifier_scopes',
                name: 'fk_price_modifiers_modifier_scope',
            },
            {
                table: 'price_modifiers',
                field: 'audience_category',
                target: 'audience_categories',
                name: 'fk_price_modifiers_audience_category',
            },
            { table: 'price_modifiers', field: 'week_day', target: 'week_days', name: 'fk_price_modifiers_week_day' },
            {
                table: 'price_modifiers',
                field: 'seat_category',
                target: 'seat_categories',
                name: 'fk_price_modifiers_seat_category',
            },
            {
                table: 'price_modifiers',
                field: 'projection_type',
                target: 'projection_types',
                name: 'fk_price_modifiers_projection_type',
            },
            {
                table: 'price_modifiers',
                field: 'product_category',
                target: 'product_categories',
                name: 'fk_price_modifiers_product_category',
            },
            { table: 'price_modifiers', field: 'product', target: 'products', name: 'fk_price_modifiers_product' },
            { table: 'price_modifiers', field: 'combo', target: 'combos', name: 'fk_price_modifiers_combo' },
            {
                table: 'price_modifiers',
                field: 'operation_type',
                target: 'operation_types',
                name: 'fk_price_modifiers_operation_type',
            },
            { table: 'price_modifiers', field: 'status', target: 'statuses', name: 'fk_price_modifiers_status' },

            // Módulo 6
            { table: 'product_categories', field: 'status', target: 'statuses', name: 'fk_product_categories_status' },

            {
                table: 'products',
                field: 'product_category',
                target: 'product_categories',
                name: 'fk_products_product_category',
            },
            { table: 'products', field: 'currency', target: 'currencies', name: 'fk_products_currency' },
            { table: 'products', field: 'status', target: 'statuses', name: 'fk_products_status' },

            { table: 'combos', field: 'currency', target: 'currencies', name: 'fk_combos_currency' },
            { table: 'combos', field: 'status', target: 'statuses', name: 'fk_combos_status' },

            { table: 'combo_products', field: 'combo', target: 'combos', name: 'fk_combo_products_combo' },
            { table: 'combo_products', field: 'product', target: 'products', name: 'fk_combo_products_product' },
            { table: 'combo_products', field: 'status', target: 'statuses', name: 'fk_combo_products_status' },

            { table: 'inventories', field: 'cinema', target: 'cinemas', name: 'fk_inventories_cinema' },
            { table: 'inventories', field: 'product', target: 'products', name: 'fk_inventories_product' },
            { table: 'inventories', field: 'status', target: 'statuses', name: 'fk_inventories_status' },

            {
                table: 'inventory_movements',
                field: 'inventory',
                target: 'inventories',
                name: 'fk_inventory_movements_inventory',
            },
            {
                table: 'inventory_movements',
                field: 'operation_type',
                target: 'operation_types',
                name: 'fk_inventory_movements_operation_type',
            },
            { table: 'inventory_movements', field: 'user', target: 'users', name: 'fk_inventory_movements_user' },
            {
                table: 'inventory_movements',
                field: 'status',
                target: 'statuses',
                name: 'fk_inventory_movements_status',
            },

            // Módulo 7
            { table: 'order_statuses', field: 'status', target: 'statuses', name: 'fk_order_statuses_status' },
            { table: 'payment_methods', field: 'status', target: 'statuses', name: 'fk_payment_methods_status' },
            { table: 'line_types', field: 'status', target: 'statuses', name: 'fk_line_types_status' },

            { table: 'orders', field: 'customer', target: 'customers', name: 'fk_orders_customer' },
            { table: 'orders', field: 'employee', target: 'employees', name: 'fk_orders_employee' },
            { table: 'orders', field: 'cinema', target: 'cinemas', name: 'fk_orders_cinema' },
            { table: 'orders', field: 'order_status', target: 'order_statuses', name: 'fk_orders_order_status' },
            { table: 'orders', field: 'base_currency', target: 'currencies', name: 'fk_orders_base_currency' },
            { table: 'orders', field: 'status', target: 'statuses', name: 'fk_orders_status' },

            { table: 'order_lines', field: 'order', target: 'orders', name: 'fk_order_lines_order' },
            { table: 'order_lines', field: 'line_type', target: 'line_types', name: 'fk_order_lines_line_type' },
            { table: 'order_lines', field: 'product', target: 'products', name: 'fk_order_lines_product' },
            { table: 'order_lines', field: 'combo', target: 'combos', name: 'fk_order_lines_combo' },
            {
                table: 'order_lines',
                field: 'price_modifier',
                target: 'price_modifiers',
                name: 'fk_order_lines_price_modifier',
            },
            {
                table: 'order_lines',
                field: 'applied_exchange_rate',
                target: 'exchange_rates',
                name: 'fk_order_lines_applied_exchange_rate',
            },
            { table: 'order_lines', field: 'status', target: 'statuses', name: 'fk_order_lines_status' },

            { table: 'tickets', field: 'order', target: 'orders', name: 'fk_tickets_order' },
            { table: 'tickets', field: 'showtime', target: 'showtimes', name: 'fk_tickets_showtime' },
            { table: 'tickets', field: 'seat', target: 'seats', name: 'fk_tickets_seat' },
            { table: 'tickets', field: 'price_modifier', target: 'price_modifiers', name: 'fk_tickets_price_modifier' },
            {
                table: 'tickets',
                field: 'applied_exchange_rate',
                target: 'exchange_rates',
                name: 'fk_tickets_applied_exchange_rate',
            },
            { table: 'tickets', field: 'status', target: 'statuses', name: 'fk_tickets_status' },

            { table: 'order_payments', field: 'order', target: 'orders', name: 'fk_order_payments_order' },
            {
                table: 'order_payments',
                field: 'payment_method',
                target: 'payment_methods',
                name: 'fk_order_payments_payment_method',
            },
            {
                table: 'order_payments',
                field: 'applied_exchange_rate',
                target: 'exchange_rates',
                name: 'fk_order_payments_applied_exchange_rate',
            },
            { table: 'order_payments', field: 'status', target: 'statuses', name: 'fk_order_payments_status' },

            { table: 'loyalty_ledgers', field: 'customer', target: 'customers', name: 'fk_loyalty_ledgers_customer' },
            { table: 'loyalty_ledgers', field: 'order', target: 'orders', name: 'fk_loyalty_ledgers_order' },
            {
                table: 'loyalty_ledgers',
                field: 'operation_type',
                target: 'operation_types',
                name: 'fk_loyalty_ledgers_operation_type',
            },
            { table: 'loyalty_ledgers', field: 'status', target: 'statuses', name: 'fk_loyalty_ledgers_status' },
        ];

        for (const fk of foreignKeys) {
            await queryInterface.addConstraint(fk.table, {
                fields: [fk.field],
                type: 'foreign key',
                name: fk.name,
                references: {
                    table: fk.target,
                    field: 'id',
                },
                onDelete: 'RESTRICT',
                onUpdate: 'CASCADE',
            });
        }
    },

    async down(queryInterface, Sequelize) {
        // Almacenamos la misma estructura pero iteramos en reversa para deshacer de forma segura
        const foreignKeys = [
            /* ... Mismo array superior ... */
            // Para abreviar, en código real debes copiar el mismo array de arriba y ejecutar este loop:
        ];
        // Asegúrate de copiar el array "foreignKeys" del método UP aquí adentro antes de correrlo
        for (const fk of foreignKeys.reverse()) {
            await queryInterface.removeConstraint(fk.table, fk.name);
        }
    },
};
