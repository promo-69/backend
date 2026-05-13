'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
	async up(queryInterface, Sequelize) {
		const createTable = async (tableName, attributes) => queryInterface.createTable(tableName, attributes);
		const addUnique = async (tableName, fields, indexName) =>
			queryInterface.addIndex(tableName, fields, { unique: true, name: indexName, where: { deleted_at: null } });
		const addIndex = async (tableName, fields, indexName) =>
			queryInterface.addIndex(tableName, fields, { name: indexName });

		// --- MÓDULO 1: CATÁLOGOS BASE ---
		await createTable('operation_types', {
			id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
			description: { type: Sequelize.STRING(255), allowNull: false },
			is_increment: { type: Sequelize.BOOLEAN, allowNull: false },
			deleted_at: { type: Sequelize.DATE, allowNull: true },
		});
		await addUnique('operation_types', ['description'], 'idx_operation_types_description_uq');

		await createTable('genders', {
			id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
			description: { type: Sequelize.STRING(255), allowNull: false },
			deleted_at: { type: Sequelize.DATE, allowNull: true },
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
			deleted_at: { type: Sequelize.DATE, allowNull: true },
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
			deleted_at: { type: Sequelize.DATE, allowNull: true },
		});
		await addUnique('people', ['document_number'], 'idx_people_document_number_uq');

		await createTable('user_types', {
			id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
			description: { type: Sequelize.STRING(255), allowNull: false },
			deleted_at: { type: Sequelize.DATE, allowNull: true },
		});
		await addUnique('user_types', ['description'], 'idx_user_types_description_uq');

		await createTable('roles', {
			id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
			code: { type: Sequelize.STRING(50), allowNull: false },
			name: { type: Sequelize.STRING(100), allowNull: false },
			description: { type: Sequelize.STRING(255), allowNull: false },
			deleted_at: { type: Sequelize.DATE, allowNull: true },
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
			signup_code: { type: Sequelize.STRING(60), allowNull: true },
			signup_verified_at: { type: Sequelize.DATE, allowNull: true },
			created_at: {
				type: Sequelize.DATE,
				allowNull: false,
				defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
			},
			updated_at: { type: Sequelize.DATE, allowNull: true },
			deleted_at: { type: Sequelize.DATE, allowNull: true },
		});
		await addUnique('users', ['email'], 'idx_users_email_uq');

		await createTable('users_logins', {
			id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
			user: { type: Sequelize.INTEGER, allowNull: false },
			device: { type: Sequelize.STRING(500), allowNull: true },
			jti: { type: Sequelize.STRING(255), allowNull: false },
			expires_at: { type: Sequelize.DATE, allowNull: false },
			created_at: {
				type: Sequelize.DATE,
				allowNull: false,
				defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
			},
			updated_at: { type: Sequelize.DATE, allowNull: true },
			deleted_at: { type: Sequelize.DATE, allowNull: true },
		});
		await addUnique('users_logins', ['jti'], 'idx_users_logins_jti_uq');
		await addIndex('users_logins', ['user'], 'idx_users_logins_user');

		await createTable('job_positions', {
			id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
			title: { type: Sequelize.STRING(255), allowNull: false },
			description: { type: Sequelize.STRING(255), allowNull: true },
			is_pensionable: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
			deleted_at: { type: Sequelize.DATE, allowNull: true },
		});
		await addUnique('job_positions', ['title'], 'idx_job_positions_title_uq');

		await createTable('employees', {
			id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
			person: { type: Sequelize.INTEGER, allowNull: false },
			employee_code: { type: Sequelize.STRING(50), allowNull: false },
			deleted_at: { type: Sequelize.DATE, allowNull: true },
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
			deleted_at: { type: Sequelize.DATE, allowNull: true },
		});

		await createTable('loyalty_levels', {
			id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
			name: { type: Sequelize.STRING(100), allowNull: false },
			required_points: { type: Sequelize.INTEGER, allowNull: true },
			deleted_at: { type: Sequelize.DATE, allowNull: true },
		});
		await addUnique('loyalty_levels', ['name'], 'idx_loyalty_levels_name_uq');

		await createTable('customers', {
			id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
			person: { type: Sequelize.INTEGER, allowNull: false },
			loyalty_level: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 1 },
			level_progress_points: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
			current_points_balance: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
			registration_date: {
				type: Sequelize.DATE,
				allowNull: false,
				defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
			},
			deleted_at: { type: Sequelize.DATE, allowNull: true },
		});
		await addUnique('customers', ['person'], 'idx_customers_people_uq');

		await createTable('actions', {
			id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
			code: { type: Sequelize.STRING(100), allowNull: false },
			description: { type: Sequelize.STRING(255), allowNull: false },
			deleted_at: { type: Sequelize.DATE, allowNull: true },
		});
		await addUnique('actions', ['code'], 'idx_actions_code_uq');

		await createTable('resources', {
			id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
			code: { type: Sequelize.STRING(100), allowNull: false },
			description: { type: Sequelize.STRING(255), allowNull: false },
			deleted_at: { type: Sequelize.DATE, allowNull: true },
		});
		await addUnique('resources', ['code'], 'idx_resources_code_uq');

		await createTable('permission_types', {
			id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
			code: { type: Sequelize.STRING(100), allowNull: false },
			description: { type: Sequelize.STRING(255), allowNull: false },
			deleted_at: { type: Sequelize.DATE, allowNull: true },
		});
		await addUnique('permission_types', ['code'], 'idx_permission_types_code_uq');

		await createTable('permissions', {
			id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
			action: { type: Sequelize.INTEGER, allowNull: false },
			resource: { type: Sequelize.INTEGER, allowNull: false },
			permission_type: { type: Sequelize.INTEGER, allowNull: false },
			deleted_at: { type: Sequelize.DATE, allowNull: true },
		});
		await addUnique('permissions', ['action', 'resource', 'permission_type'], 'idx_permissions_uq');

		await createTable('role_permissions', {
			id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
			role: { type: Sequelize.INTEGER, allowNull: false },
			permission: { type: Sequelize.INTEGER, allowNull: false },
			deleted_at: { type: Sequelize.DATE, allowNull: true },
		});
		await addUnique('role_permissions', ['role', 'permission'], 'idx_role_permissions_uq');

		await createTable('role_inheritances', {
			id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
			parent_role: { type: Sequelize.INTEGER, allowNull: false },
			child_role: { type: Sequelize.INTEGER, allowNull: false },
			deleted_at: { type: Sequelize.DATE, allowNull: true },
		});
		await addUnique('role_inheritances', ['parent_role', 'child_role'], 'idx_role_inheritances_uq');

		await createTable('user_permissions', {
			id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
			user: { type: Sequelize.INTEGER, allowNull: false },
			permission: { type: Sequelize.INTEGER, allowNull: false },
			is_granted: { type: Sequelize.BOOLEAN, allowNull: false },
			deleted_at: { type: Sequelize.DATE, allowNull: true },
		});
		await addUnique('user_permissions', ['user', 'permission'], 'idx_user_permissions_uq');

		// --- MÓDULO 3: INFRAESTRUCTURA ---
		await createTable('projection_types', {
			id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
			description: { type: Sequelize.STRING(255), allowNull: false },
			deleted_at: { type: Sequelize.DATE, allowNull: true },
		});
		await addUnique('projection_types', ['description'], 'idx_projection_types_description_uq');

		await createTable('rooms', {
			id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
			cinema: { type: Sequelize.INTEGER, allowNull: false },
			name: { type: Sequelize.STRING(100), allowNull: false },
			grid_rows: { type: Sequelize.INTEGER, allowNull: false },
			grid_columns: { type: Sequelize.INTEGER, allowNull: false },
			deleted_at: { type: Sequelize.DATE, allowNull: true },
		});
		await addUnique('rooms', ['cinema', 'name'], 'idx_rooms_cinema_name_uq');

		await createTable('room_projection_types', {
			id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
			room: { type: Sequelize.INTEGER, allowNull: false },
			projection_type: { type: Sequelize.INTEGER, allowNull: false },
			deleted_at: { type: Sequelize.DATE, allowNull: true },
		});
		await addUnique('room_projection_types', ['room', 'projection_type'], 'idx_room_projection_types_uq');

		await createTable('seat_categories', {
			id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
			description: { type: Sequelize.STRING(255), allowNull: false },
			deleted_at: { type: Sequelize.DATE, allowNull: true },
		});
		await addUnique('seat_categories', ['description'], 'idx_seat_categories_description_uq');

		await createTable('seat_conditions', {
			id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
			description: { type: Sequelize.STRING(255), allowNull: false },
			deleted_at: { type: Sequelize.DATE, allowNull: true },
		});
		await addUnique('seat_conditions', ['description'], 'idx_seat_conditions_description_uq');

		await createTable('seats', {
			id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
			room: { type: Sequelize.INTEGER, allowNull: false },
			row_identifier: { type: Sequelize.STRING(2), allowNull: false },
			column_number: { type: Sequelize.INTEGER, allowNull: false },
			seat_category: { type: Sequelize.INTEGER, allowNull: false },
			seat_condition: { type: Sequelize.INTEGER, allowNull: false },
			deleted_at: { type: Sequelize.DATE, allowNull: true },
		});
		await addUnique('seats', ['room', 'row_identifier', 'column_number'], 'idx_seats_room_row_col_uq');

		// --- MÓDULO 4: ECONOMÍA ---
		await createTable('currencies', {
			id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
			code: { type: Sequelize.STRING(10), allowNull: false },
			description: { type: Sequelize.STRING(255), allowNull: false },
			symbol: { type: Sequelize.STRING(10), allowNull: false },
			is_base_currency: { type: Sequelize.BOOLEAN, allowNull: false },
			deleted_at: { type: Sequelize.DATE, allowNull: true },
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
			deleted_at: { type: Sequelize.DATE, allowNull: true },
		});
		await addIndex('exchange_rates', ['currency', 'created_at'], 'idx_exchange_rates_currency_date');

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
				deleted_at: { type: Sequelize.DATE, allowNull: true },
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
			poster_url: { type: Sequelize.STRING(255), allowNull: true },
			banner_url: { type: Sequelize.STRING(255), allowNull: true },
			release_date: { type: Sequelize.DATEONLY, allowNull: false },
			deleted_at: { type: Sequelize.DATE, allowNull: true },
		});
		await addUnique('movies', ['title'], 'idx_movies_title_uq');

		await createTable('movie_genres', {
			id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
			movie: { type: Sequelize.INTEGER, allowNull: false },
			genre: { type: Sequelize.INTEGER, allowNull: false },
			deleted_at: { type: Sequelize.DATE, allowNull: true },
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
			deleted_at: { type: Sequelize.DATE, allowNull: true },
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
			deleted_at: { type: Sequelize.DATE, allowNull: true },
		});
		await addUnique('showtimes', ['room', 'start_time'], 'idx_showtimes_room_time_uq');
		await addIndex('showtimes', ['movie', 'start_time'], 'idx_showtimes_movie_time');
		await addIndex('showtimes', ['room', 'start_time'], 'idx_showtimes_room_time');

		await createTable('week_days', {
			id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
			description: { type: Sequelize.STRING(50), allowNull: false },
			day_number: { type: Sequelize.INTEGER, allowNull: false },
			deleted_at: { type: Sequelize.DATE, allowNull: true },
		});
		await addUnique('week_days', ['day_number'], 'idx_week_days_day_number_uq');

		await createTable('price_modifiers', {
			id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
			description: { type: Sequelize.STRING(255), allowNull: false },
			operation_type: { type: Sequelize.INTEGER, allowNull: false },
			is_percentage: { type: Sequelize.BOOLEAN, allowNull: false },
			value: { type: Sequelize.DECIMAL(10, 2), allowNull: false },
			currency: { type: Sequelize.INTEGER, allowNull: true },
			modifier_scope: { type: Sequelize.INTEGER, allowNull: false },
			audience_category: { type: Sequelize.INTEGER, allowNull: true },
			week_day: { type: Sequelize.INTEGER, allowNull: true },
			seat_category: { type: Sequelize.INTEGER, allowNull: true },
			projection_type: { type: Sequelize.INTEGER, allowNull: true },
			product_category: { type: Sequelize.INTEGER, allowNull: true },
			product: { type: Sequelize.INTEGER, allowNull: true },
			combo: { type: Sequelize.INTEGER, allowNull: true },
			cinema: { type: Sequelize.INTEGER, allowNull: true },
			start_date: { type: Sequelize.DATEONLY, allowNull: true },
			end_date: { type: Sequelize.DATEONLY, allowNull: true },
			start_time: { type: Sequelize.TIME, allowNull: true },
			end_time: { type: Sequelize.TIME, allowNull: true },
			line_type: { type: Sequelize.INTEGER, allowNull: true },
			target_currency: { type: Sequelize.INTEGER, allowNull: true },
			target_currency_condition: { type: Sequelize.BOOLEAN, allowNull: true, defaultValue: false },
			deleted_at: { type: Sequelize.DATE, allowNull: true },
		});
		// Índice para buscar rápidamente reglas vigentes en fechas
		await addIndex('price_modifiers', ['start_date', 'end_date'], 'idx_price_modifiers_dates');
		// Índice para filtrar rápidamente si la regla es de Boletería, Confitería u Orden General
		await addIndex('price_modifiers', ['modifier_scope'], 'idx_price_modifiers_scope');
		// Índice para filtrar reglas exclusivas de una sucursal específica
		await addIndex('price_modifiers', ['cinema'], 'idx_price_modifiers_cinema');

		// --- MÓDULO 6: INVENTARIO ---
		await createTable('product_categories', {
			id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
			description: { type: Sequelize.STRING(255), allowNull: false },
			deleted_at: { type: Sequelize.DATE, allowNull: true },
		});
		await addUnique('product_categories', ['description'], 'idx_product_categories_name_uq');

		await createTable('products', {
			id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
			name: { type: Sequelize.STRING(255), allowNull: false },
			sku: { type: Sequelize.STRING(100), allowNull: false },
			image_url: { type: Sequelize.STRING(500), allowNull: true },
			product_category: { type: Sequelize.INTEGER, allowNull: false },
			currency: { type: Sequelize.INTEGER, allowNull: false },
			price: { type: Sequelize.DECIMAL(10, 2), allowNull: false },
			earned_loyalty_points: { type: Sequelize.INTEGER, allowNull: true },
			deleted_at: { type: Sequelize.DATE, allowNull: true },
		});
		await addUnique('products', ['sku'], 'idx_products_sku_uq');

		await createTable('combos', {
			id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
			name: { type: Sequelize.STRING(255), allowNull: false },
			sku: { type: Sequelize.STRING(100), allowNull: false },
			description: { type: Sequelize.STRING(255), allowNull: false },
			image_url: { type: Sequelize.STRING(500), allowNull: true },
			currency: { type: Sequelize.INTEGER, allowNull: false },
			price: { type: Sequelize.DECIMAL(10, 2), allowNull: false },
			earned_loyalty_points: { type: Sequelize.INTEGER, allowNull: true },
			deleted_at: { type: Sequelize.DATE, allowNull: true },
		});
		await addUnique('combos', ['sku'], 'idx_combos_sku_uq');

		await createTable('combo_products', {
			id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
			combo: { type: Sequelize.INTEGER, allowNull: false },
			product: { type: Sequelize.INTEGER, allowNull: false },
			quantity: { type: Sequelize.INTEGER, allowNull: false },
			deleted_at: { type: Sequelize.DATE, allowNull: true },
		});
		await addUnique('combo_products', ['combo', 'product'], 'idx_combo_products_uq');

		await createTable('inventories', {
			id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
			cinema: { type: Sequelize.INTEGER, allowNull: false },
			product: { type: Sequelize.INTEGER, allowNull: false },
			minimum_stock: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
			stock: { type: Sequelize.INTEGER, allowNull: false },
			current_unit_cost_base_currency: { type: Sequelize.DECIMAL(10, 2), allowNull: false, defaultValue: 0.0 },
			deleted_at: { type: Sequelize.DATE, allowNull: true },
		});
		await addUnique('inventories', ['cinema', 'product'], 'idx_inventories_cinema_product_uq');

		await createTable('inventory_movements', {
			id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
			inventory: { type: Sequelize.INTEGER, allowNull: false },
			operation_type: { type: Sequelize.INTEGER, allowNull: false },
			quantity: { type: Sequelize.INTEGER, allowNull: false },
			unit_cost: { type: Sequelize.DECIMAL(10, 2), allowNull: false, defaultValue: 0.0 },
			currency: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 1 },
			user: { type: Sequelize.INTEGER, allowNull: false },
			created_at: {
				type: Sequelize.DATE,
				allowNull: false,
				defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
			},
			remarks: { type: Sequelize.STRING(255), allowNull: true },
			deleted_at: { type: Sequelize.DATE, allowNull: true },
		});
		await addIndex('inventory_movements', ['inventory', 'operation_type'], 'idx_inv_mov_calc');

		// --- MÓDULO 7: TRANSACCIONES ---
		const transCatalogs = ['order_statuses', 'line_types'];
		for (const catalog of transCatalogs) {
			await createTable(catalog, {
				id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
				description: { type: Sequelize.STRING(255), allowNull: false },
				deleted_at: { type: Sequelize.DATE, allowNull: true },
			});
			await addUnique(catalog, ['description'], `idx_${catalog}_uq`);
		}

		await createTable('taxes', {
			id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
			name: { type: Sequelize.STRING(100), allowNull: false },
			rate: { type: Sequelize.DECIMAL(10, 2), allowNull: false },
			is_percentage: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
			deleted_at: { type: Sequelize.DATE, allowNull: true },
		});
		await addUnique('taxes', ['name'], 'idx_taxes_name_uq');

		// 2. Motor de Reglas de Impuestos
		await createTable('tax_rules', {
			id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
			tax: { type: Sequelize.INTEGER, allowNull: false },
			tax_scope: { type: Sequelize.INTEGER, allowNull: false }, // 1: Boletería, 2: Confitería, 3: Orden General
			cinema: { type: Sequelize.INTEGER, allowNull: true },
			line_type: { type: Sequelize.INTEGER, allowNull: true },
			product_category: { type: Sequelize.INTEGER, allowNull: true },
			product: { type: Sequelize.INTEGER, allowNull: true },
			combo: { type: Sequelize.INTEGER, allowNull: true },
			deleted_at: { type: Sequelize.DATE, allowNull: true },
		});
		await addIndex('tax_rules', ['tax_scope'], 'idx_tax_rules_scope');
		await addIndex('tax_rules', ['cinema'], 'idx_tax_rules_cinema');

		await createTable('payment_methods', {
			id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
			description: { type: Sequelize.STRING(255), allowNull: false },
			requires_reference: { type: Sequelize.BOOLEAN, allowNull: false },
			deleted_at: { type: Sequelize.DATE, allowNull: true },
		});
		await addUnique('payment_methods', ['description'], 'idx_payment_methods_uq');

		await createTable('orders', {
			id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
			customer: { type: Sequelize.INTEGER, allowNull: false },
			employee: { type: Sequelize.INTEGER, allowNull: true },
			cinema: { type: Sequelize.INTEGER, allowNull: false },
			system_base_currency: { type: Sequelize.INTEGER, allowNull: false },
			subtotal_base_currency: { type: Sequelize.DECIMAL(10, 2), allowNull: false },
			tax_amount_base_currency: { type: Sequelize.DECIMAL(10, 2), allowNull: false },
			total_amount_base_currency: { type: Sequelize.DECIMAL(10, 2), allowNull: false },
			generated_points: { type: Sequelize.INTEGER, allowNull: false },
			order_status: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 1 },
			created_at: {
				type: Sequelize.DATE,
				allowNull: false,
				defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
			},
			deleted_at: { type: Sequelize.DATE, allowNull: true },
		});
		await addIndex('orders', ['customer'], 'idx_orders_customer');
		await addIndex('orders', ['cinema', 'created_at'], 'idx_orders_cinema_date');

		await createTable('invoice_sequences', {
			id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
			cinema: { type: Sequelize.INTEGER, allowNull: false },
			prefix: { type: Sequelize.STRING(10), allowNull: false },
			current_value: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
			deleted_at: { type: Sequelize.DATE, allowNull: true },
		});
		await addUnique('invoice_sequences', ['cinema'], 'idx_invoice_sequences_cinema_uq');
		await addUnique('invoice_sequences', ['prefix'], 'idx_invoice_sequences_prefix_uq');

		await createTable('invoices', {
			id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
			order: { type: Sequelize.INTEGER, allowNull: false },
			invoice_number: { type: Sequelize.STRING(100), allowNull: false },
			billing_document: { type: Sequelize.STRING(100), allowNull: false },
			billing_name: { type: Sequelize.STRING(255), allowNull: false },
			billing_address: { type: Sequelize.TEXT, allowNull: true },
			issued_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
			deleted_at: { type: Sequelize.DATE, allowNull: true },
		});
		await addUnique('invoices', ['invoice_number'], 'idx_invoices_number_uq');
		await addIndex('invoices', ['order'], 'idx_invoices_order');
		await addIndex('invoices', ['billing_document'], 'idx_invoices_billing_document');
		await addIndex('invoices', ['issued_at'], 'idx_invoices_issued_at');

		// Snapshot de Impuestos por Orden (Se calcula antes de pagar)
		await createTable('order_taxes', {
			id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
			order: { type: Sequelize.INTEGER, allowNull: false },
			tax: { type: Sequelize.INTEGER, allowNull: false },
			applied_rate: { type: Sequelize.DECIMAL(10, 2), allowNull: false },
			tax_amount_base_currency: { type: Sequelize.DECIMAL(10, 2), allowNull: false },
			deleted_at: { type: Sequelize.DATE, allowNull: true },
		});
		await addIndex('order_taxes', ['order'], 'idx_order_taxes_order');

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
			quoted_exchange_rate: { type: Sequelize.INTEGER, allowNull: false },
			deleted_at: { type: Sequelize.DATE, allowNull: true },
		});
		await addIndex('order_lines', ['order'], 'idx_order_lines_order');

		await createTable('tickets', {
			id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
			order: { type: Sequelize.INTEGER, allowNull: false },
			showtime: { type: Sequelize.INTEGER, allowNull: false },
			seat: { type: Sequelize.INTEGER, allowNull: false },
			original_price: { type: Sequelize.DECIMAL(10, 2), allowNull: false },
			price_modifier: { type: Sequelize.INTEGER, allowNull: true },
			price: { type: Sequelize.DECIMAL(10, 2), allowNull: false },
			quoted_exchange_rate: { type: Sequelize.INTEGER, allowNull: false },
			qr_code: { type: Sequelize.STRING(500), allowNull: false },
			validation_time: { type: Sequelize.DATE, allowNull: true },
			deleted_at: { type: Sequelize.DATE, allowNull: true },
		});
		await addUnique('tickets', ['showtime', 'seat'], 'idx_tickets_showtime_seat_uq');
		await addUnique('tickets', ['qr_code'], 'idx_tickets_qr_code_uq');
		await addIndex('tickets', ['order'], 'idx_tickets_order');

		await createTable('order_payments', {
			id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
			order: { type: Sequelize.INTEGER, allowNull: false },
			payment_method: { type: Sequelize.INTEGER, allowNull: false },
			amount: { type: Sequelize.DECIMAL(10, 2), allowNull: false },
			quoted_exchange_rate: { type: Sequelize.INTEGER, allowNull: false },
			reference_number: { type: Sequelize.STRING(255), allowNull: true },
			is_approved: { type: Sequelize.BOOLEAN, allowNull: false },
			created_at: {
				type: Sequelize.DATE,
				allowNull: false,
				defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
			},
			deleted_at: { type: Sequelize.DATE, allowNull: true },
		});
		await addUnique('order_payments', ['payment_method', 'reference_number'], 'idx_order_payments_ref_uq');
		await addIndex('order_payments', ['order'], 'idx_order_payments_order');
		await addIndex('order_payments', ['payment_method', 'created_at'], 'idx_payments_method_date');

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
			deleted_at: { type: Sequelize.DATE, allowNull: true },
		});
		await addIndex('loyalty_ledgers', ['customer', 'operation_type'], 'idx_loyalty_customer_op');

		// --- MÓDULO 8: EVENTOS PRIVADOS ---
		await createTable('event_types', {
			id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
			description: { type: Sequelize.STRING(255), allowNull: false },
			deleted_at: { type: Sequelize.DATE, allowNull: true },
		});
		await addUnique('event_types', ['description'], 'idx_event_types_desc_uq');

		await createTable('rental_requests', {
			id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
			event_type: { type: Sequelize.INTEGER, allowNull: false },
			cinema: { type: Sequelize.INTEGER, allowNull: false },
			customer: { type: Sequelize.INTEGER, allowNull: true },
			contact_name: { type: Sequelize.STRING(255), allowNull: false },
			contact_email: { type: Sequelize.STRING(255), allowNull: false },
			contact_phone: { type: Sequelize.STRING(50), allowNull: false },
			event_date: { type: Sequelize.DATE, allowNull: false },
			attendees: { type: Sequelize.INTEGER, allowNull: false },
			created_at: {
				type: Sequelize.DATE,
				allowNull: false,
				defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
			},
			deleted_at: { type: Sequelize.DATE, allowNull: true },
		});
		await addIndex('rental_requests', ['cinema', 'event_date'], 'idx_rental_requests_cinema_date');

		// ==============================================================================
		// APLICACIÓN DE CONSTRAINTS "CHECK"
		// ==============================================================================
		const checkConstraints = [
			'ALTER TABLE cinemas ADD CONSTRAINT chk_cinemas_times CHECK (closing_time > opening_time);',
			'ALTER TABLE users ADD CONSTRAINT chk_users_role CHECK ((user_type = 1 AND role IS NOT NULL) OR (user_type = 2 AND role IS NULL));',
			'ALTER TABLE role_inheritances ADD CONSTRAINT chk_role_inheritances_diff CHECK (parent_role <> child_role);',
			'ALTER TABLE rooms ADD CONSTRAINT chk_rooms_capacity CHECK (grid_rows > 0 AND grid_columns > 0);',
			'ALTER TABLE seats ADD CONSTRAINT chk_seats_col CHECK (column_number > 0);',
			'ALTER TABLE exchange_rates ADD CONSTRAINT chk_exchange_rates_rate CHECK (rate > 0);',
			'ALTER TABLE movies ADD CONSTRAINT chk_movies_duration CHECK (duration_minutes > 0);',
			'ALTER TABLE showtimes ADD CONSTRAINT chk_showtimes_times CHECK (end_time > start_time AND price >= 0);',
			'ALTER TABLE week_days ADD CONSTRAINT chk_week_days_range CHECK (day_number BETWEEN 1 AND 7);',
			`ALTER TABLE price_modifiers ADD CONSTRAINT chk_price_modifiers_logic
             CHECK (value > 0 AND
             ((modifier_scope = 1 AND product_category IS NULL AND product IS NULL AND combo IS NULL AND line_type IS NULL) OR
             (modifier_scope = 2 AND audience_category IS NULL AND seat_category IS NULL AND projection_type IS NULL) OR
             (modifier_scope = 3 AND product_category IS NULL AND product IS NULL AND combo IS NULL AND audience_category IS NULL AND seat_category IS NULL AND projection_type IS NULL AND line_type IS NULL))
            );`,
			'ALTER TABLE price_modifiers ADD CONSTRAINT chk_price_modifiers_dates CHECK (start_date IS NULL OR end_date IS NULL OR end_date >= start_date);',
			'ALTER TABLE price_modifiers ADD CONSTRAINT chk_price_modifiers_times CHECK (start_time IS NULL OR end_time IS NULL OR end_time > start_time);',
			'ALTER TABLE combo_products ADD CONSTRAINT chk_combo_products_qty CHECK (quantity > 0);',
			'ALTER TABLE inventories ADD CONSTRAINT chk_inventories_stock CHECK (stock >= 0);',
			'ALTER TABLE inventories ADD CONSTRAINT chk_inventories_min_stock CHECK (minimum_stock >= 0);',
			'ALTER TABLE inventories ADD CONSTRAINT chk_inventories_unit_cost CHECK (current_unit_cost_base_currency >= 0);',
			'ALTER TABLE inventory_movements ADD CONSTRAINT chk_inventory_movements_qty CHECK (quantity > 0);',
			'ALTER TABLE inventory_movements ADD CONSTRAINT chk_inventory_movements_cost CHECK (unit_cost >= 0);',
			'ALTER TABLE orders ADD CONSTRAINT chk_orders_amounts CHECK (subtotal_base_currency >= 0 AND tax_amount_base_currency >= 0 AND total_amount_base_currency >= 0 AND generated_points >= 0);',
			'ALTER TABLE order_taxes ADD CONSTRAINT chk_order_taxes_amounts CHECK (applied_rate >= 0 AND tax_amount_base_currency >= 0);',
			`ALTER TABLE tax_rules ADD CONSTRAINT chk_tax_rules_logic
 CHECK (
   ((tax_scope = 1 AND product_category IS NULL AND product IS NULL AND combo IS NULL AND line_type IS NULL) OR
   (tax_scope = 2) OR
   (tax_scope = 3 AND product_category IS NULL AND product IS NULL AND combo IS NULL AND line_type IS NULL))
 );`,
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
			'ALTER TABLE customers ADD CONSTRAINT chk_customers_pts_balance CHECK (current_points_balance >= 0);',
			'ALTER TABLE rental_requests ADD CONSTRAINT chk_rental_requests_attendees CHECK (attendees > 0);',
			'ALTER TABLE taxes ADD CONSTRAINT chk_taxes_rate CHECK (rate >= 0);',
		];

		for (const sql of checkConstraints) await queryInterface.sequelize.query(sql);
	},

	async down(queryInterface, Sequelize) {
		// Array en orden inverso exacto a la creación
		const tables = [
			'rental_requests',
			'event_types',
			'loyalty_ledgers',
			'order_payments',
			'tickets',
			'order_lines',
			'invoices',
			'invoice_sequences',
			'order_taxes',
			'orders',
			'tax_rules',
			'taxes',
			'payment_methods',
			'line_types',
			'order_statuses',
			'inventory_movements',
			'inventories',
			'combo_products',
			'combos',
			'products',
			'product_categories',
			'price_modifiers',
			'week_days',
			'showtimes',
			'movie_subscriptions',
			'movie_genres',
			'movies',
			'modifier_scopes',
			'audience_categories',
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
			'users_logins',
			'users',
			'roles',
			'user_types',
			'people',
			'cinemas',
			'genders',
			'operation_types',
		];

		for (const table of tables) await queryInterface.dropTable(table);
	},
};
