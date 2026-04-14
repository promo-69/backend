'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        const createTable = async (tableName, attributes) => queryInterface.createTable(tableName, attributes);
        const addUnique = async (tableName, fields, indexName) =>
            queryInterface.addIndex(tableName, fields, { unique: true, name: indexName });

        // --- MÓDULO 1: CATÁLOGOS BASE ---
        await createTable('statuses', {
            id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
            description: { type: Sequelize.STRING(255), allowNull: false },
        });
        await addUnique('statuses', ['description'], 'idx_statuses_description_uq');

        await createTable('operation_types', {
            id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
            description: { type: Sequelize.STRING(255), allowNull: false },
            is_increment: { type: Sequelize.BOOLEAN, allowNull: false },
            status: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 1 },
        });
        await addUnique('operation_types', ['description'], 'idx_operation_types_description_uq');

        await createTable('genders', {
            id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
            description: { type: Sequelize.STRING(255), allowNull: false },
            status: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 1 },
        });
        await addUnique('genders', ['description'], 'idx_genders_description_uq');

        // --- MÓDULO 2: IDENTIDAD Y RBAC ---
        await createTable('cinemas', {
            id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
            name: { type: Sequelize.STRING(255), allowNull: false },
            address: { type: Sequelize.TEXT, allowNull: true },
            phone: { type: Sequelize.STRING(50), allowNull: true },
            opening_time: { type: Sequelize.TIME, allowNull: false },
            closing_time: { type: Sequelize.TIME, allowNull: false },
            status: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 1 },
        });
        await addUnique('cinemas', ['name'], 'idx_cinemas_name_uq');

        await createTable('people', {
            id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
            document_number: { type: Sequelize.STRING(50), allowNull: false },
            first_name: { type: Sequelize.STRING(255), allowNull: false },
            last_name: { type: Sequelize.STRING(255), allowNull: false },
            gender: { type: Sequelize.INTEGER, allowNull: true },
            phone_number: { type: Sequelize.STRING(50), allowNull: true },
            personal_email: { type: Sequelize.STRING(100), allowNull: true },
            birth_date: { type: Sequelize.DATEONLY, allowNull: true },
            created_at: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
            },
            updated_at: { type: Sequelize.DATE, allowNull: true },
            status: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 1 },
        });
        await addUnique('people', ['document_number'], 'idx_people_document_number_uq');

        await createTable('user_types', {
            id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
            description: { type: Sequelize.STRING(255), allowNull: false },
            status: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 1 },
        });
        await addUnique('user_types', ['description'], 'idx_user_types_description_uq');

        await createTable('roles', {
            id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
            code: { type: Sequelize.STRING(50), allowNull: false },
            name: { type: Sequelize.STRING(100), allowNull: false },
            description: { type: Sequelize.STRING(255), allowNull: false },
            status: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 1 },
        });
        await addUnique('roles', ['code'], 'idx_roles_code_uq');
        await addUnique('roles', ['name'], 'idx_roles_name_uq');

        await createTable('users', {
            id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
            person: { type: Sequelize.INTEGER, allowNull: false },
            user_type: { type: Sequelize.INTEGER, allowNull: false },
            role: { type: Sequelize.INTEGER, allowNull: true },
            email: { type: Sequelize.STRING(100), allowNull: false },
            password: { type: Sequelize.STRING(255), allowNull: false },
            last_login: { type: Sequelize.DATE, allowNull: true },
            created_at: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
            },
            updated_at: { type: Sequelize.DATE, allowNull: true },
            status: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 1 },
        });
        await addUnique('users', ['email'], 'idx_users_email_uq');

        await createTable('job_positions', {
            id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
            title: { type: Sequelize.STRING(255), allowNull: false },
            description: { type: Sequelize.STRING(255), allowNull: true },
            is_pensionable: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
            status: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 1 },
        });
        await addUnique('job_positions', ['title'], 'idx_job_positions_title_uq');

        await createTable('employees', {
            id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
            person: { type: Sequelize.INTEGER, allowNull: false },
            employee_code: { type: Sequelize.STRING(50), allowNull: false },
            status: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 1 },
        });
        await addUnique('employees', ['person'], 'idx_employees_people_uq');
        await addUnique('employees', ['employee_code'], 'idx_employees_code_uq');

        await createTable('employee_positions', {
            id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
            employee: { type: Sequelize.INTEGER, allowNull: false },
            job_position: { type: Sequelize.INTEGER, allowNull: false },
            cinema: { type: Sequelize.INTEGER, allowNull: false },
            start_date: { type: Sequelize.DATEONLY, allowNull: false },
            end_date: { type: Sequelize.DATEONLY, allowNull: true },
            salary_base: { type: Sequelize.DECIMAL(10, 2), allowNull: true },
            status: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 1 },
        });

        await createTable('loyalty_levels', {
            id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
            name: { type: Sequelize.STRING(100), allowNull: false },
            required_points: { type: Sequelize.INTEGER, allowNull: true },
            status: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 1 },
        });
        await addUnique('loyalty_levels', ['name'], 'idx_loyalty_levels_name_uq');

        await createTable('customers', {
            id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
            person: { type: Sequelize.INTEGER, allowNull: false },
            loyalty_level: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 1 },
            level_progress_points: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
            registration_date: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
            },
            status: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 1 },
        });
        await addUnique('customers', ['person'], 'idx_customers_people_uq');

        await createTable('actions', {
            id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
            code: { type: Sequelize.STRING(100), allowNull: false },
            description: { type: Sequelize.STRING(255), allowNull: false },
            status: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 1 },
        });
        await addUnique('actions', ['code'], 'idx_actions_code_uq');

        await createTable('resources', {
            id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
            code: { type: Sequelize.STRING(100), allowNull: false },
            description: { type: Sequelize.STRING(255), allowNull: false },
            status: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 1 },
        });
        await addUnique('resources', ['code'], 'idx_resources_code_uq');

        await createTable('permission_types', {
            id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
            code: { type: Sequelize.STRING(100), allowNull: false },
            description: { type: Sequelize.STRING(255), allowNull: false },
            status: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 1 },
        });
        await addUnique('permission_types', ['code'], 'idx_permission_types_code_uq');

        await createTable('permissions', {
            id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
            action: { type: Sequelize.INTEGER, allowNull: false },
            resource: { type: Sequelize.INTEGER, allowNull: false },
            permission_type: { type: Sequelize.INTEGER, allowNull: false },
            status: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 1 },
        });
        await addUnique('permissions', ['action', 'resource', 'permission_type'], 'idx_permissions_uq');

        await createTable('role_permissions', {
            id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
            role: { type: Sequelize.INTEGER, allowNull: false },
            permission: { type: Sequelize.INTEGER, allowNull: false },
            status: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 1 },
        });
        await addUnique('role_permissions', ['role', 'permission'], 'idx_role_permissions_uq');

        await createTable('role_inheritances', {
            id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
            parent_role: { type: Sequelize.INTEGER, allowNull: false },
            child_role: { type: Sequelize.INTEGER, allowNull: false },
            status: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 1 },
        });
        await addUnique('role_inheritances', ['parent_role', 'child_role'], 'idx_role_inheritances_uq');

        await createTable('user_permissions', {
            id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
            user: { type: Sequelize.INTEGER, allowNull: false },
            permission: { type: Sequelize.INTEGER, allowNull: false },
            is_granted: { type: Sequelize.BOOLEAN, allowNull: false },
            status: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 1 },
        });
        await addUnique('user_permissions', ['user', 'permission'], 'idx_user_permissions_uq');

        // --- MÓDULO 3: INFRAESTRUCTURA ---
        await createTable('projection_types', {
            id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
            description: { type: Sequelize.STRING(255), allowNull: false },
            status: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 1 },
        });
        await addUnique('projection_types', ['description'], 'idx_projection_types_description_uq');

        await createTable('rooms', {
            id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
            cinema: { type: Sequelize.INTEGER, allowNull: false },
            name: { type: Sequelize.STRING(100), allowNull: false },
            grid_rows: { type: Sequelize.INTEGER, allowNull: false },
            grid_columns: { type: Sequelize.INTEGER, allowNull: false },
            total_capacity: { type: Sequelize.INTEGER, allowNull: false },
            status: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 1 },
        });
        await addUnique('rooms', ['cinema', 'name'], 'idx_rooms_cinema_name_uq');

        await createTable('room_projection_types', {
            id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
            room: { type: Sequelize.INTEGER, allowNull: false },
            projection_type: { type: Sequelize.INTEGER, allowNull: false },
            status: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 1 },
        });
        await addUnique('room_projection_types', ['room', 'projection_type'], 'idx_room_projection_types_uq');

        await createTable('seat_categories', {
            id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
            description: { type: Sequelize.STRING(255), allowNull: false },
            status: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 1 },
        });
        await addUnique('seat_categories', ['description'], 'idx_seat_categories_description_uq');

        await createTable('seat_conditions', {
            id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
            description: { type: Sequelize.STRING(255), allowNull: false },
            status: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 1 },
        });
        await addUnique('seat_conditions', ['description'], 'idx_seat_conditions_description_uq');

        await createTable('seats', {
            id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
            room: { type: Sequelize.INTEGER, allowNull: false },
            row_identifier: { type: Sequelize.STRING(2), allowNull: false },
            column_number: { type: Sequelize.INTEGER, allowNull: false },
            seat_category: { type: Sequelize.INTEGER, allowNull: false },
            seat_condition: { type: Sequelize.INTEGER, allowNull: false },
            status: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 1 },
        });
        await addUnique('seats', ['room', 'row_identifier', 'column_number'], 'idx_seats_room_row_col_uq');

        // --- MÓDULO 4: ECONOMÍA ---
        await createTable('currencies', {
            id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
            code: { type: Sequelize.STRING(10), allowNull: false },
            description: { type: Sequelize.STRING(255), allowNull: false },
            symbol: { type: Sequelize.STRING(10), allowNull: false },
            is_base_currency: { type: Sequelize.BOOLEAN, allowNull: false },
            status: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 1 },
        });
        await addUnique('currencies', ['code'], 'idx_currencies_code_uq');

        await createTable('exchange_rates', {
            id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
            currency: { type: Sequelize.INTEGER, allowNull: false },
            rate: { type: Sequelize.DECIMAL(10, 2), allowNull: false },
            user: { type: Sequelize.INTEGER, allowNull: false },
            created_at: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
            },
            status: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 1 },
        });

        // --- MÓDULO 5: CARTELERA Y PRECIOS ---
        const simpleCatalogs = [
            'genres',
            'age_classifications',
            'movie_lifecycle_states',
            'audience_categories',
            'modifier_scopes',
        ];
        for (const catalog of simpleCatalogs) {
            await createTable(catalog, {
                id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
                description: { type: Sequelize.STRING(255), allowNull: false },
                status: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 1 },
            });
            await addUnique(catalog, ['description'], `idx_${catalog}_description_uq`);
        }

        await createTable('movies', {
            id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
            title: { type: Sequelize.STRING(255), allowNull: false },
            duration_minutes: { type: Sequelize.INTEGER, allowNull: false },
            age_classification: { type: Sequelize.INTEGER, allowNull: false },
            lifecycle_state: { type: Sequelize.INTEGER, allowNull: false },
            synopsis: { type: Sequelize.TEXT, allowNull: false },
            trailer_url: { type: Sequelize.STRING(255), allowNull: true },
            release_date: { type: Sequelize.DATEONLY, allowNull: false },
            status: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 1 },
        });
        await addUnique('movies', ['title'], 'idx_movies_title_uq');

        await createTable('movie_genres', {
            id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
            movie: { type: Sequelize.INTEGER, allowNull: false },
            genre: { type: Sequelize.INTEGER, allowNull: false },
            status: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 1 },
        });
        await addUnique('movie_genres', ['movie', 'genre'], 'idx_movie_genres_uq');

        await createTable('movie_subscriptions', {
            id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
            customer: { type: Sequelize.INTEGER, allowNull: false },
            movie: { type: Sequelize.INTEGER, allowNull: false },
            is_notified: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
            created_at: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
            },
            status: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 1 },
        });
        await addUnique('movie_subscriptions', ['customer', 'movie'], 'idx_movie_subscriptions_uq');

        await createTable('showtimes', {
            id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
            movie: { type: Sequelize.INTEGER, allowNull: false },
            room: { type: Sequelize.INTEGER, allowNull: false },
            projection_type: { type: Sequelize.INTEGER, allowNull: false },
            start_time: { type: Sequelize.DATE, allowNull: false },
            end_time: { type: Sequelize.DATE, allowNull: false },
            currency: { type: Sequelize.INTEGER, allowNull: false },
            price: { type: Sequelize.DECIMAL(10, 2), allowNull: false },
            earned_loyalty_points: { type: Sequelize.INTEGER, allowNull: true },
            status: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 1 },
        });
        await addUnique('showtimes', ['room', 'start_time'], 'idx_showtimes_room_time_uq');

        await createTable('week_days', {
            id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
            description: { type: Sequelize.STRING(50), allowNull: false },
            day_number: { type: Sequelize.INTEGER, allowNull: false },
            status: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 1 },
        });
        await addUnique('week_days', ['day_number'], 'idx_week_days_day_number_uq');

        await createTable('price_modifiers', {
            id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
            description: { type: Sequelize.STRING(255), allowNull: false },
            modifier_scope: { type: Sequelize.INTEGER, allowNull: false },
            audience_category: { type: Sequelize.INTEGER, allowNull: true },
            week_day: { type: Sequelize.INTEGER, allowNull: true },
            seat_category: { type: Sequelize.INTEGER, allowNull: true },
            projection_type: { type: Sequelize.INTEGER, allowNull: true },
            product_category: { type: Sequelize.INTEGER, allowNull: true },
            product: { type: Sequelize.INTEGER, allowNull: true },
            combo: { type: Sequelize.INTEGER, allowNull: true },
            operation_type: { type: Sequelize.INTEGER, allowNull: false },
            is_percentage: { type: Sequelize.BOOLEAN, allowNull: false },
            value: { type: Sequelize.DECIMAL(10, 2), allowNull: false },
            status: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 1 },
        });

        // --- MÓDULO 6: INVENTARIO ---
        await createTable('product_categories', {
            id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
            description: { type: Sequelize.STRING(255), allowNull: false },
            status: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 1 },
        });
        await addUnique('product_categories', ['description'], 'idx_product_categories_name_uq');

        await createTable('products', {
            id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
            name: { type: Sequelize.STRING(255), allowNull: false },
            sku: { type: Sequelize.STRING(100), allowNull: false },
            product_category: { type: Sequelize.INTEGER, allowNull: false },
            currency: { type: Sequelize.INTEGER, allowNull: false },
            price: { type: Sequelize.DECIMAL(10, 2), allowNull: false },
            earned_loyalty_points: { type: Sequelize.INTEGER, allowNull: true },
            status: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 1 },
        });
        await addUnique('products', ['sku'], 'idx_products_sku_uq');

        await createTable('combos', {
            id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
            name: { type: Sequelize.STRING(255), allowNull: false },
            sku: { type: Sequelize.STRING(100), allowNull: false },
            description: { type: Sequelize.STRING(255), allowNull: false },
            currency: { type: Sequelize.INTEGER, allowNull: false },
            price: { type: Sequelize.DECIMAL(10, 2), allowNull: false },
            earned_loyalty_points: { type: Sequelize.INTEGER, allowNull: true },
            status: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 1 },
        });
        await addUnique('combos', ['sku'], 'idx_combos_sku_uq');

        await createTable('combo_products', {
            id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
            combo: { type: Sequelize.INTEGER, allowNull: false },
            product: { type: Sequelize.INTEGER, allowNull: false },
            quantity: { type: Sequelize.INTEGER, allowNull: false },
            status: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 1 },
        });
        await addUnique('combo_products', ['combo', 'product'], 'idx_combo_products_uq');

        await createTable('inventories', {
            id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
            cinema: { type: Sequelize.INTEGER, allowNull: false },
            product: { type: Sequelize.INTEGER, allowNull: false },
            stock: { type: Sequelize.INTEGER, allowNull: false },
            status: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 1 },
        });
        await addUnique('inventories', ['cinema', 'product'], 'idx_inventories_cinema_product_uq');

        await createTable('inventory_movements', {
            id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
            inventory: { type: Sequelize.INTEGER, allowNull: false },
            operation_type: { type: Sequelize.INTEGER, allowNull: false },
            quantity: { type: Sequelize.INTEGER, allowNull: false },
            user: { type: Sequelize.INTEGER, allowNull: false },
            created_at: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
            },
            remarks: { type: Sequelize.STRING(255), allowNull: true },
            status: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 1 },
        });

        // --- MÓDULO 7: TRANSACCIONES ---
        const transCatalogs = ['order_statuses', 'line_types'];
        for (const catalog of transCatalogs) {
            await createTable(catalog, {
                id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
                description: { type: Sequelize.STRING(255), allowNull: false },
                status: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 1 },
            });
            await addUnique(catalog, ['description'], `idx_${catalog}_uq`);
        }

        await createTable('payment_methods', {
            id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
            description: { type: Sequelize.STRING(255), allowNull: false },
            requires_reference: { type: Sequelize.BOOLEAN, allowNull: false },
            status: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 1 },
        });
        await addUnique('payment_methods', ['description'], 'idx_payment_methods_uq');

        await createTable('orders', {
            id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
            customer: { type: Sequelize.INTEGER, allowNull: false },
            employee_position: { type: Sequelize.INTEGER, allowNull: true },
            cinema: { type: Sequelize.INTEGER, allowNull: false },
            order_status: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 1 },
            base_currency: { type: Sequelize.INTEGER, allowNull: false },
            total_amount_base_currency: { type: Sequelize.DECIMAL(10, 2), allowNull: false },
            generated_points: { type: Sequelize.INTEGER, allowNull: false },
            created_at: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
            },
            status: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 1 },
        });

        await createTable('order_lines', {
            id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
            order: { type: Sequelize.INTEGER, allowNull: false },
            line_type: { type: Sequelize.INTEGER, allowNull: false },
            product: { type: Sequelize.INTEGER, allowNull: true },
            combo: { type: Sequelize.INTEGER, allowNull: true },
            quantity: { type: Sequelize.INTEGER, allowNull: false },
            original_unit_price: { type: Sequelize.DECIMAL(10, 2), allowNull: false },
            price_modifier: { type: Sequelize.INTEGER, allowNull: true },
            unit_price: { type: Sequelize.DECIMAL(10, 2), allowNull: false },
            applied_exchange_rate: { type: Sequelize.INTEGER, allowNull: false },
            status: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 1 },
        });

        await createTable('tickets', {
            id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
            order: { type: Sequelize.INTEGER, allowNull: false },
            showtime: { type: Sequelize.INTEGER, allowNull: false },
            seat: { type: Sequelize.INTEGER, allowNull: false },
            original_price: { type: Sequelize.DECIMAL(10, 2), allowNull: false },
            price_modifier: { type: Sequelize.INTEGER, allowNull: true },
            price: { type: Sequelize.DECIMAL(10, 2), allowNull: false },
            applied_exchange_rate: { type: Sequelize.INTEGER, allowNull: false },
            qr_code: { type: Sequelize.STRING(500), allowNull: false },
            validation_time: { type: Sequelize.DATE, allowNull: true },
            status: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 1 },
        });
        await addUnique('tickets', ['showtime', 'seat'], 'idx_tickets_showtime_seat_uq');
        await addUnique('tickets', ['qr_code'], 'idx_tickets_qr_code_uq');

        await createTable('order_payments', {
            id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
            order: { type: Sequelize.INTEGER, allowNull: false },
            payment_method: { type: Sequelize.INTEGER, allowNull: false },
            amount: { type: Sequelize.DECIMAL(10, 2), allowNull: false },
            applied_exchange_rate: { type: Sequelize.INTEGER, allowNull: false },
            reference_number: { type: Sequelize.STRING(255), allowNull: true },
            is_approved: { type: Sequelize.BOOLEAN, allowNull: false },
            status: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 1 },
        });
        await addUnique('order_payments', ['payment_method', 'reference_number'], 'idx_order_payments_ref_uq');

        await createTable('loyalty_ledgers', {
            id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
            customer: { type: Sequelize.INTEGER, allowNull: false },
            order: { type: Sequelize.INTEGER, allowNull: true },
            operation_type: { type: Sequelize.INTEGER, allowNull: false },
            points: { type: Sequelize.INTEGER, allowNull: false },
            created_at: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
            },
            status: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 1 },
        });

        // ==============================================================================
        // APLICACIÓN DE CONSTRAINTS "CHECK"
        // ==============================================================================
        const checkConstraints = [
            'ALTER TABLE cinemas ADD CONSTRAINT chk_cinemas_times CHECK (closing_time > opening_time);',
            'ALTER TABLE users ADD CONSTRAINT chk_users_role CHECK ((user_type = 1 AND role IS NOT NULL) OR (user_type = 2 AND role IS NULL));',
            'ALTER TABLE role_inheritances ADD CONSTRAINT chk_role_inheritances_diff CHECK (parent_role <> child_role);',
            'ALTER TABLE rooms ADD CONSTRAINT chk_rooms_capacity CHECK (grid_rows > 0 AND grid_columns > 0 AND total_capacity >= 0);',
            'ALTER TABLE seats ADD CONSTRAINT chk_seats_col CHECK (column_number > 0);',
            'ALTER TABLE exchange_rates ADD CONSTRAINT chk_exchange_rates_rate CHECK (rate > 0);',
            'ALTER TABLE movies ADD CONSTRAINT chk_movies_duration CHECK (duration_minutes > 0);',
            'ALTER TABLE showtimes ADD CONSTRAINT chk_showtimes_times CHECK (end_time > start_time AND price >= 0);',
            'ALTER TABLE week_days ADD CONSTRAINT chk_week_days_range CHECK (day_number BETWEEN 1 AND 7);',
            `ALTER TABLE price_modifiers ADD CONSTRAINT chk_price_modifiers_logic 
            CHECK (value > 0 AND 
            ((modifier_scope = 1 AND product_category IS NULL AND product IS NULL AND combo IS NULL) OR 
         (modifier_scope = 2 AND audience_category IS NULL AND seat_category IS NULL AND projection_type IS NULL) OR 
         (modifier_scope = 3 AND product_category IS NULL AND product IS NULL AND combo IS NULL AND audience_category IS NULL AND seat_category IS NULL AND projection_type IS NULL))
         );`,
            'ALTER TABLE combo_products ADD CONSTRAINT chk_combo_products_qty CHECK (quantity > 0);',
            'ALTER TABLE inventories ADD CONSTRAINT chk_inventories_stock CHECK (stock >= 0);',
            'ALTER TABLE inventory_movements ADD CONSTRAINT chk_inventory_movements_qty CHECK (quantity > 0);',
            'ALTER TABLE orders ADD CONSTRAINT chk_orders_amounts CHECK (total_amount_base_currency >= 0 AND generated_points >= 0);',
            `ALTER TABLE order_lines ADD CONSTRAINT chk_order_lines_logic 
         CHECK (quantity > 0 AND original_unit_price >= 0 AND unit_price >= 0 AND 
         ((line_type = 1 AND product IS NOT NULL AND combo IS NULL) OR 
         (line_type = 2 AND product IS NULL AND combo IS NOT NULL))
         );`,
            'ALTER TABLE tickets ADD CONSTRAINT chk_tickets_prices CHECK (original_price >= 0 AND price >= 0);',
            'ALTER TABLE order_payments ADD CONSTRAINT chk_order_payments_amt CHECK (amount > 0);',
            'ALTER TABLE loyalty_ledgers ADD CONSTRAINT chk_loyalty_ledgers_pts CHECK (points > 0);',
            'ALTER TABLE employee_positions ADD CONSTRAINT chk_employee_positions_dates CHECK (end_date IS NULL OR end_date >= start_date);',
            'ALTER TABLE loyalty_levels ADD CONSTRAINT chk_loyalty_levels_pts CHECK (required_points >= 0);',
            'ALTER TABLE customers ADD CONSTRAINT chk_customers_progress CHECK (level_progress_points >= 0);',
        ];

        for (const sql of checkConstraints) await queryInterface.sequelize.query(sql);
    },

    async down(queryInterface, Sequelize) {
        // Array en orden inverso exacto a la creación
        const tables = [
            'loyalty_ledgers',
            'order_payments',
            'tickets',
            'order_lines',
            'orders',
            'line_types',
            'payment_methods',
            'order_statuses',
            'inventory_movements',
            'inventories',
            'combo_products',
            'combos',
            'products',
            'product_categories',
            'price_modifiers',
            'modifier_scopes',
            'week_days',
            'audience_categories',
            'showtimes',
            'movie_subscriptions',
            'movie_genres',
            'movies',
            'movie_lifecycle_states',
            'age_classifications',
            'genres',
            'exchange_rates',
            'currencies',
            'seats',
            'seat_conditions',
            'seat_categories',
            'room_projection_types',
            'rooms',
            'projection_types',
            'user_permissions',
            'role_inheritances',
            'role_permissions',
            'permissions',
            'permission_types',
            'resources',
            'actions',
            'customers',
            'loyalty_levels',
            'employee_positions',
            'employees',
            'job_positions',
            'users',
            'roles',
            'user_types',
            'people',
            'cinemas',
            'genders',
            'operation_types',
            'statuses',
        ];

        for (const table of tables) await queryInterface.dropTable(table);
    },
};
