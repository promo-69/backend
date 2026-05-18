'use strict';
const foreignKeys = [
	// Módulo 2
	{ table: 'people', field: 'gender', target: 'genders', name: 'fk_people_gender' },
	{ table: 'users', field: 'person', target: 'people', name: 'fk_users_people' },
	{ table: 'users', field: 'user_type', target: 'user_types', name: 'fk_users_user_type' },
	{ table: 'users', field: 'role', target: 'roles', name: 'fk_users_role' },
	{ table: 'users_logins', field: 'user', target: 'users', name: 'fk_users_logins_user' },
	{ table: 'employees', field: 'person', target: 'people', name: 'fk_employees_people' },
	{
		table: 'employee_positions',
		field: 'employee',
		target: 'employees',
		name: 'fk_employee_positions_employee',
	},
	{
		table: 'employee_positions',
		field: 'job_position',
		target: 'job_positions',
		name: 'fk_employee_positions_job_position',
	},
	{ table: 'employee_positions', field: 'cinema', target: 'cinemas', name: 'fk_employee_positions_cinema' },
	{ table: 'customers', field: 'person', target: 'people', name: 'fk_customers_people' },
	{
		table: 'customers',
		field: 'loyalty_level',
		target: 'loyalty_levels',
		name: 'fk_customers_loyalty_level',
	},
	{ table: 'permissions', field: 'action', target: 'actions', name: 'fk_permissions_action' },
	{ table: 'permissions', field: 'resource', target: 'resources', name: 'fk_permissions_resource' },
	{
		table: 'permissions',
		field: 'permission_type',
		target: 'permission_types',
		name: 'fk_permissions_permission_type',
	},
	{ table: 'role_permissions', field: 'role', target: 'roles', name: 'fk_role_permissions_role' },
	{
		table: 'role_permissions',
		field: 'permission',
		target: 'permissions',
		name: 'fk_role_permissions_permission',
	},
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
	{ table: 'user_permissions', field: 'user', target: 'users', name: 'fk_user_permissions_user' },
	{
		table: 'user_permissions',
		field: 'permission',
		target: 'permissions',
		name: 'fk_user_permissions_permission',
	},

	// Módulo 3
	{ table: 'rooms', field: 'cinema', target: 'cinemas', name: 'fk_rooms_cinema' },
	{ table: 'room_projection_types', field: 'room', target: 'rooms', name: 'fk_room_projection_types_room' },
	{
		table: 'room_projection_types',
		field: 'projection_type',
		target: 'projection_types',
		name: 'fk_room_projection_types_projection_type',
	},
	{ table: 'seats', field: 'room', target: 'rooms', name: 'fk_seats_room' },
	{ table: 'seats', field: 'seat_category', target: 'seat_categories', name: 'fk_seats_seat_category' },
	{ table: 'seats', field: 'seat_condition', target: 'seat_conditions', name: 'fk_seats_seat_condition' },

	// Módulo 4
	{ table: 'exchange_rates', field: 'currency', target: 'currencies', name: 'fk_exchange_rates_currency' },
	{ table: 'exchange_rates', field: 'user', target: 'users', name: 'fk_exchange_rates_user' },

	// Módulo 5
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
	{ table: 'movie_genres', field: 'movie', target: 'movies', name: 'fk_movie_genres_movie' },
	{ table: 'movie_genres', field: 'genre', target: 'genres', name: 'fk_movie_genres_genre' },
	{
		table: 'movie_subscriptions',
		field: 'customer',
		target: 'customers',
		name: 'fk_movie_subscriptions_customer',
	},
	{ table: 'movie_subscriptions', field: 'movie', target: 'movies', name: 'fk_movie_subscriptions_movie' },

	{ table: 'room_bookings', field: 'room', target: 'rooms', name: 'fk_room_bookings_room' },
	{ table: 'room_bookings', field: 'booking_type', target: 'booking_types', name: 'fk_room_bookings_booking_type' },

	{ table: 'showtimes', field: 'booking', target: 'room_bookings', name: 'fk_showtimes_booking' },
	{ table: 'showtimes', field: 'movie', target: 'movies', name: 'fk_showtimes_movie' },
	{ table: 'showtimes', field: 'projection_type', target: 'projection_types', name: 'fk_showtimes_projection_type' },
	{ table: 'showtimes', field: 'currency', target: 'currencies', name: 'fk_showtimes_currency' },

	{ table: 'room_events', field: 'booking', target: 'room_bookings', name: 'fk_room_events_booking' },
	{ table: 'room_events', field: 'event_type', target: 'booking_types', name: 'fk_room_events_event_type' },
	{ table: 'room_events', field: 'currency', target: 'currencies', name: 'fk_room_events_currency' },

	{ table: 'rental_requests', field: 'customer', target: 'customers', name: 'fk_rental_requests_customer' },
	{ table: 'rental_requests', field: 'room', target: 'rooms', name: 'fk_rental_requests_room' },
	{ table: 'rental_requests', field: 'booking', target: 'room_bookings', name: 'fk_rental_requests_booking' },
	{ table: 'rental_requests', field: 'event_type', target: 'booking_types', name: 'fk_rental_requests_event_type' },
	{ table: 'rental_requests', field: 'currency', target: 'currencies', name: 'fk_rental_requests_currency' },

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
	{ table: 'price_modifiers', field: 'cinema', target: 'cinemas', name: 'fk_price_modifiers_cinema' },
	{
		table: 'price_modifiers',
		field: 'line_type',
		target: 'line_types',
		name: 'fk_price_modifiers_line_type',
	},
	{ table: 'price_modifiers', field: 'currency', target: 'currencies', name: 'fk_price_modifiers_currency' },
	{
		table: 'price_modifiers',
		field: 'target_currency',
		target: 'currencies',
		name: 'fk_price_modifiers_target_currency',
	},

	// Módulo 6
	{
		table: 'products',
		field: 'product_category',
		target: 'product_categories',
		name: 'fk_products_product_category',
	},
	{ table: 'products', field: 'currency', target: 'currencies', name: 'fk_products_currency' },
	{ table: 'combos', field: 'currency', target: 'currencies', name: 'fk_combos_currency' },
	{ table: 'combos', field: 'cinema', target: 'cinemas', name: 'fk_combos_cinema' },
	{ table: 'combo_products', field: 'combo', target: 'combos', name: 'fk_combo_products_combo' },
	{ table: 'combo_products', field: 'product', target: 'products', name: 'fk_combo_products_product' },
	{ table: 'inventories', field: 'cinema', target: 'cinemas', name: 'fk_inventories_cinema' },
	{ table: 'inventories', field: 'product', target: 'products', name: 'fk_inventories_product' },
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
	{
		table: 'inventory_movements',
		field: 'currency',
		target: 'currencies',
		name: 'fk_inventory_movements_currency',
	},
	{ table: 'inventory_movements', field: 'user', target: 'users', name: 'fk_inventory_movements_user' },

	// Módulo 7
	{ table: 'orders', field: 'customer', target: 'customers', name: 'fk_orders_customer' },
	{
		table: 'orders',
		field: 'employee',
		target: 'employees',
		name: 'fk_orders_employee',
	},
	{ table: 'orders', field: 'cinema', target: 'cinemas', name: 'fk_orders_cinema' },
	{ table: 'orders', field: 'order_status', target: 'order_statuses', name: 'fk_orders_order_status' },
	{
		table: 'orders',
		field: 'system_base_currency',
		target: 'currencies',
		name: 'fk_orders_system_base_currency',
	},

	{ table: 'order_taxes', field: 'order', target: 'orders', name: 'fk_order_taxes_order' },
	{ table: 'order_taxes', field: 'tax', target: 'taxes', name: 'fk_order_taxes_tax' },

	{ table: 'invoice_sequences', field: 'cinema', target: 'cinemas', name: 'fk_invoice_sequences_cinema' },

	{ table: 'tax_rules', field: 'tax', target: 'taxes', name: 'fk_tax_rules_tax' },
	{ table: 'tax_rules', field: 'cinema', target: 'cinemas', name: 'fk_tax_rules_cinema' },
	{ table: 'tax_rules', field: 'line_type', target: 'line_types', name: 'fk_tax_rules_line_type' },
	{
		table: 'tax_rules',
		field: 'product_category',
		target: 'product_categories',
		name: 'fk_tax_rules_product_category',
	},
	{ table: 'tax_rules', field: 'product', target: 'products', name: 'fk_tax_rules_product' },
	{ table: 'tax_rules', field: 'combo', target: 'combos', name: 'fk_tax_rules_combo' },

	{ table: 'invoices', field: 'order', target: 'orders', name: 'fk_invoices_order' },

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
		field: 'quoted_exchange_rate',
		target: 'exchange_rates',
		name: 'fk_order_lines_quoted_exchange_rate',
	},

	{ table: 'tickets', field: 'order', target: 'orders', name: 'fk_tickets_order' },
	{ table: 'tickets', field: 'showtime', target: 'showtimes', name: 'fk_tickets_showtime' },
	{ table: 'tickets', field: 'seat', target: 'seats', name: 'fk_tickets_seat' },
	{ table: 'tickets', field: 'price_modifier', target: 'price_modifiers', name: 'fk_tickets_price_modifier' },
	{
		table: 'tickets',
		field: 'quoted_exchange_rate',
		target: 'exchange_rates',
		name: 'fk_tickets_quoted_exchange_rate',
	},

	{ table: 'order_payments', field: 'order', target: 'orders', name: 'fk_order_payments_order' },
	{
		table: 'order_payments',
		field: 'payment_method',
		target: 'payment_methods',
		name: 'fk_order_payments_payment_method',
	},
	{
		table: 'order_payments',
		field: 'quoted_exchange_rate',
		target: 'exchange_rates',
		name: 'fk_order_payments_quoted_exchange_rate',
	},

	{ table: 'loyalty_ledgers', field: 'customer', target: 'customers', name: 'fk_loyalty_ledgers_customer' },
	{ table: 'loyalty_ledgers', field: 'order', target: 'orders', name: 'fk_loyalty_ledgers_order' },
	{
		table: 'loyalty_ledgers',
		field: 'operation_type',
		target: 'operation_types',
		name: 'fk_loyalty_ledgers_operation_type',
	},
];

/** @type {import('sequelize-cli').Migration} */
module.exports = {
	async up(queryInterface, Sequelize) {
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
		for (const fk of foreignKeys.reverse()) await queryInterface.removeConstraint(fk.table, fk.name);
	},
};
