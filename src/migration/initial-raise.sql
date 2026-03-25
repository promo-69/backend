-- ==============================================================================
-- FASE 1: CREACIÓN DE ESTRUCTURAS, RESTRICCIONES DE DOMINIO E ÍNDICES ÚNICOS
-- ==============================================================================

-- --- MÓDULO 1: CATÁLOGOS BASE Y OPERADORES ---
CREATE TABLE statuses (
    id SERIAL PRIMARY KEY,
    description VARCHAR(255) NOT NULL
);
CREATE UNIQUE INDEX idx_statuses_description_uq ON statuses (description);

CREATE TABLE operation_types (
    id SERIAL PRIMARY KEY,
    description VARCHAR(255) NOT NULL,
    is_increment BOOLEAN NOT NULL,
    status INTEGER NOT NULL
);
CREATE UNIQUE INDEX idx_operation_types_description_uq ON operation_types (description);

CREATE TABLE genders (
    id SERIAL PRIMARY KEY,
    description VARCHAR(255) NOT NULL,
    status INTEGER NOT NULL
);
CREATE UNIQUE INDEX idx_genders_description_uq ON genders (description);

-- --- MÓDULO 2: IDENTIDAD, SUCURSALES Y RBAC ---
CREATE TABLE cinemas (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    address TEXT,
    phone VARCHAR(50),
    opening_time TIME NOT NULL,
    closing_time TIME NOT NULL,
    status INTEGER NOT NULL,
    CHECK (closing_time > opening_time)
);
CREATE UNIQUE INDEX idx_cinemas_name_uq ON cinemas (name);

CREATE TABLE people (
    id SERIAL PRIMARY KEY,
    document_number VARCHAR(50) NOT NULL,
    first_name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255) NOT NULL,
    gender INTEGER,
    phone_number VARCHAR(50),
    email VARCHAR(100),
    birth_date date,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP,
    status INTEGER NOT NULL
);
CREATE UNIQUE INDEX idx_people_document_number_uq ON people (document_number);

CREATE TABLE user_types (
    id SERIAL PRIMARY KEY,
    description VARCHAR(255) NOT NULL,
    status INTEGER NOT NULL
);
CREATE UNIQUE INDEX idx_user_types_description_uq ON user_types (description);

CREATE TABLE roles (
    id SERIAL PRIMARY KEY,
    code VARCHAR(100) NOT NULL,
    description VARCHAR(255) NOT NULL,
    status INTEGER NOT NULL
);
CREATE UNIQUE INDEX idx_roles_code_uq ON roles (code);

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    person INTEGER NOT NULL,
    user_type INTEGER NOT NULL,
    role INTEGER,
    username VARCHAR(100) NOT NULL,
    password VARCHAR(255) NOT NULL,
    last_login TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP,
    status INTEGER NOT NULL,
    CHECK ((user_type = 1 AND role IS NOT NULL) OR (user_type = 2 AND role IS NULL))
);
CREATE UNIQUE INDEX idx_users ON users (username);

CREATE TABLE employees (
    id SERIAL PRIMARY KEY,
    person INTEGER NOT NULL,
    cinema INTEGER NOT NULL,
    hire_date DATE NOT NULL,
    status INTEGER NOT NULL
);
CREATE UNIQUE INDEX idx_employees_person_uq ON employees (person);

CREATE TABLE customers (
    id SERIAL PRIMARY KEY,
    person INTEGER NOT NULL,
    registration_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status INTEGER NOT NULL
);
CREATE UNIQUE INDEX idx_customers_person_uq ON customers (person);

CREATE TABLE actions (
    id SERIAL PRIMARY KEY,
    code VARCHAR(100) NOT NULL,
    description VARCHAR(255) NOT NULL,
    status INTEGER NOT NULL
);
CREATE UNIQUE INDEX idx_actions_code_uq ON actions (code);

CREATE TABLE resources (
    id SERIAL PRIMARY KEY,
    code VARCHAR(100) NOT NULL,
    description VARCHAR(255) NOT NULL,
    status INTEGER NOT NULL
);
CREATE UNIQUE INDEX idx_resources_code_uq ON resources (code);

CREATE TABLE permission_types (
    id SERIAL PRIMARY KEY,
    code VARCHAR(100) NOT NULL,
    description VARCHAR(255) NOT NULL,
    status INTEGER NOT NULL
);
CREATE UNIQUE INDEX idx_permission_types_code_uq ON permission_types (code);

CREATE TABLE permissions (
    id SERIAL PRIMARY KEY,
    action INTEGER NOT NULL,
    resource INTEGER NOT NULL,
    permission_type INTEGER NOT NULL,
    status INTEGER NOT NULL
);
CREATE UNIQUE INDEX idx_permissions_uq ON permissions (action, resource, permission_type);

CREATE TABLE role_permissions (
    id SERIAL PRIMARY KEY,
    role INTEGER NOT NULL,
    permission INTEGER NOT NULL,
    status INTEGER NOT NULL
);
CREATE UNIQUE INDEX idx_role_permissions_uq ON role_permissions (role, permission);

CREATE TABLE role_inheritances (
    id SERIAL PRIMARY KEY,
    parent_role INTEGER NOT NULL,
    child_role INTEGER NOT NULL,
    status INTEGER NOT NULL,
    CHECK (parent_role <> child_role)
);
CREATE UNIQUE INDEX idx_role_inheritances_uq ON role_inheritances (parent_role, child_role);

CREATE TABLE user_permissions (
    id SERIAL PRIMARY KEY,
    "user" INTEGER NOT NULL,
    permission INTEGER NOT NULL,
    is_granted BOOLEAN NOT NULL,
    status INTEGER NOT NULL
);
CREATE UNIQUE INDEX idx_user_permissions_uq ON user_permissions ("user", permission);

-- --- MÓDULO 3: INFRAESTRUCTURA FÍSICA ---
CREATE TABLE projection_types (
    id SERIAL PRIMARY KEY,
    description VARCHAR(255) NOT NULL,
    status INTEGER NOT NULL
);
CREATE UNIQUE INDEX idx_projection_types_description_uq ON projection_types (description);

CREATE TABLE rooms (
    id SERIAL PRIMARY KEY,
    cinema INTEGER NOT NULL,
    name VARCHAR(100) NOT NULL,
    grid_rows INTEGER NOT NULL,
    grid_columns INTEGER NOT NULL,
    total_capacity INTEGER NOT NULL,
    status INTEGER NOT NULL,
    CHECK (grid_rows > 0 AND grid_columns > 0 AND total_capacity >= 0)
);
CREATE UNIQUE INDEX idx_rooms_cinema_name_uq ON rooms (cinema, name);

CREATE TABLE room_projection_types (
    id SERIAL PRIMARY KEY,
    room INTEGER NOT NULL,
    projection_type INTEGER NOT NULL,
    status INTEGER NOT NULL
);
CREATE UNIQUE INDEX idx_room_projection_types_uq ON room_projection_types (room, projection_type);

CREATE TABLE seat_categories (
    id SERIAL PRIMARY KEY,
    description VARCHAR(255) NOT NULL,
    status INTEGER NOT NULL
);
CREATE UNIQUE INDEX idx_seat_categories_description_uq ON seat_categories (description);

CREATE TABLE seat_conditions (
    id SERIAL PRIMARY KEY,
    description VARCHAR(255) NOT NULL,
    status INTEGER NOT NULL
);
CREATE UNIQUE INDEX idx_seat_conditions_description_uq ON seat_conditions (description);

CREATE TABLE seats (
    id SERIAL PRIMARY KEY,
    room INTEGER NOT NULL,
    row_identifier VARCHAR(2) NOT NULL,
    column_number INTEGER NOT NULL,
    seat_category INTEGER NOT NULL,
    seat_condition INTEGER NOT NULL,
    status INTEGER NOT NULL,
    CHECK (column_number > 0)
);
CREATE UNIQUE INDEX idx_seats_room_row_col_uq ON seats (room, row_identifier, column_number);

-- --- MÓDULO 4: ECONOMÍA Y TASAS DE CAMBIO ---
CREATE TABLE currencies (
    id SERIAL PRIMARY KEY,
    code VARCHAR(10) NOT NULL,
    description VARCHAR(255) NOT NULL,
    symbol VARCHAR(10) NOT NULL,
    is_base_currency BOOLEAN NOT NULL,
    status INTEGER NOT NULL
);
CREATE UNIQUE INDEX idx_currencies_code_uq ON currencies (code);

CREATE TABLE exchange_rates (
    id SERIAL PRIMARY KEY,
    currency INTEGER NOT NULL,
    rate NUMERIC(10, 2) NOT NULL,
    "user" INTEGER NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status INTEGER NOT NULL,
    CHECK (rate > 0)
);

-- --- MÓDULO 5: CARTELERA Y MOTOR DE PRECIOS ---
CREATE TABLE genres (
    id SERIAL PRIMARY KEY,
    description VARCHAR(255) NOT NULL,
    status INTEGER NOT NULL
);
CREATE UNIQUE INDEX idx_genres_description_uq ON genres (description);

CREATE TABLE age_classifications (
    id SERIAL PRIMARY KEY,
    description VARCHAR(255) NOT NULL,
    status INTEGER NOT NULL
);
CREATE UNIQUE INDEX idx_age_classifications_description_uq ON age_classifications (description);

CREATE TABLE movie_lifecycle_states (
    id SERIAL PRIMARY KEY,
    description VARCHAR(255) NOT NULL,
    status INTEGER NOT NULL
);
CREATE UNIQUE INDEX idx_movie_lifecycle_states_description_uq ON movie_lifecycle_states (description);

CREATE TABLE movies (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    duration_minutes INTEGER NOT NULL,
    age_classification INTEGER NOT NULL,
    lifecycle_state INTEGER NOT NULL,
    synopsis TEXT NOT NULL,
    trailer_url VARCHAR(255),
    release_date DATE NOT NULL,
    status INTEGER NOT NULL,
    CHECK (duration_minutes > 0)
);
CREATE UNIQUE INDEX idx_movies_title_uq ON movies (title);

CREATE TABLE movie_genres (
    id SERIAL PRIMARY KEY,
    movie INTEGER NOT NULL,
    genre INTEGER NOT NULL,
    status INTEGER NOT NULL
);
CREATE UNIQUE INDEX idx_movie_genres_uq ON movie_genres (movie, genre);

CREATE TABLE movie_subscriptions (
    id SERIAL PRIMARY KEY,
    customer INTEGER NOT NULL,
    movie INTEGER NOT NULL,
    is_notified BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status INTEGER NOT NULL
);
CREATE UNIQUE INDEX idx_movie_subscriptions_uq ON movie_subscriptions (customer, movie);

CREATE TABLE showtimes (
    id SERIAL PRIMARY KEY,
    movie INTEGER NOT NULL,
    room INTEGER NOT NULL,
    projection_type INTEGER NOT NULL,
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NOT NULL,
    currency INTEGER NOT NULL,
    price NUMERIC(10, 2) NOT NULL,
    earned_loyalty_points INTEGER,
    status INTEGER NOT NULL,
    CHECK (end_time > start_time AND price >= 0)
);
CREATE UNIQUE INDEX idx_showtimes_room_time_uq ON showtimes (room, start_time);

CREATE TABLE audience_categories (
    id SERIAL PRIMARY KEY,
    description VARCHAR(255) NOT NULL,
    status INTEGER NOT NULL
);
CREATE UNIQUE INDEX idx_audience_categories_description_uq ON audience_categories (description);

CREATE TABLE week_days (
    id SERIAL PRIMARY KEY,
    description VARCHAR(50) NOT NULL,
    day_number INTEGER NOT NULL,
    status INTEGER NOT NULL,
    CHECK (day_number BETWEEN 1 AND 7)
);
CREATE UNIQUE INDEX idx_week_days_day_number_uq ON week_days (day_number);

CREATE TABLE modifier_scopes (
    id SERIAL PRIMARY KEY,
    description VARCHAR(255) NOT NULL,
    status INTEGER NOT NULL
);

CREATE TABLE price_modifiers (
    id SERIAL PRIMARY KEY,
    description VARCHAR(255) NOT NULL,
    modifier_scope INTEGER NOT NULL,
    audience_category INTEGER,
    week_day INTEGER,
    seat_category INTEGER,
    projection_type INTEGER,
    product_category INTEGER,
    product INTEGER,
    combo INTEGER,
    operation_type INTEGER NOT NULL,
    is_percentage BOOLEAN NOT NULL,
    value NUMERIC(10, 2) NOT NULL,
    status INTEGER NOT NULL,
    CHECK (value > 0),
    CHECK (
        (modifier_scope = 1 AND product_category IS NULL AND product IS NULL AND combo IS NULL) 
        OR 
        (modifier_scope = 2 AND audience_category IS NULL AND seat_category IS NULL AND projection_type IS NULL)
        OR
        (modifier_scope = 3 AND product_category IS NULL AND product IS NULL AND combo IS NULL AND audience_category IS NULL AND seat_category IS NULL AND projection_type IS NULL)
    )
);

-- --- MÓDULO 6: INVENTARIO Y COMBOS ---
CREATE TABLE product_categories (
    id SERIAL PRIMARY KEY,
    description VARCHAR(255) NOT NULL,
    status INTEGER NOT NULL
);
CREATE UNIQUE INDEX idx_product_categories_name_uq ON product_categories (description);

CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    sku VARCHAR(100) NOT NULL,
    product_category INTEGER NOT NULL,
    currency INTEGER NOT NULL,
    price NUMERIC(10, 2) NOT NULL,
    earned_loyalty_points INTEGER,
    status INTEGER NOT NULL
);
CREATE UNIQUE INDEX idx_products_sku_uq ON products (sku);

CREATE TABLE combos (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    sku VARCHAR(100) NOT NULL,
    description VARCHAR(255) NOT NULL,
    currency INTEGER NOT NULL,
    price NUMERIC(10, 2) NOT NULL,
    earned_loyalty_points INTEGER,
    status INTEGER NOT NULL
);
CREATE UNIQUE INDEX idx_combos_sku_uq ON combos (sku);

CREATE TABLE combo_products (
    id SERIAL PRIMARY KEY,
    combo INTEGER NOT NULL,
    product INTEGER NOT NULL,
    quantity INTEGER NOT NULL,
    status INTEGER NOT NULL,
    CHECK (quantity > 0)
);
CREATE UNIQUE INDEX idx_combo_products_uq ON combo_products (combo, product);

CREATE TABLE inventories (
    id SERIAL PRIMARY KEY,
    cinema INTEGER NOT NULL,
    product INTEGER NOT NULL,
    stock INTEGER NOT NULL,
    status INTEGER NOT NULL,
    CHECK (stock >= 0)
);
CREATE UNIQUE INDEX idx_inventories_cinema_product_uq ON inventories (cinema, product);

CREATE TABLE inventory_movements (
    id SERIAL PRIMARY KEY,
    inventory INTEGER NOT NULL,
    operation_type INTEGER NOT NULL,
    quantity INTEGER NOT NULL,
    "user" INTEGER NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    remarks VARCHAR(255),
    status INTEGER NOT NULL,
    CHECK (quantity > 0)
);

-- --- MÓDULO 7: TRANSACCIONES, PAGOS Y FIDELIDAD ---
CREATE TABLE order_statuses (
    id SERIAL PRIMARY KEY,
    description VARCHAR(255) NOT NULL,
    status INTEGER NOT NULL
);
CREATE UNIQUE INDEX idx_order_statuses_uq ON order_statuses (description);

CREATE TABLE payment_methods (
    id SERIAL PRIMARY KEY,
    description VARCHAR(255) NOT NULL,
    requires_reference BOOLEAN NOT NULL,
    status INTEGER NOT NULL
);
CREATE UNIQUE INDEX idx_payment_methods_uq ON payment_methods (description);

CREATE TABLE line_types (
    id SERIAL PRIMARY KEY,
    description VARCHAR(255) NOT NULL,
    status INTEGER NOT NULL
);
CREATE UNIQUE INDEX idx_line_types_uq ON line_types (description);

CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    customer INTEGER NOT NULL,
    employee INTEGER,
    cinema INTEGER NOT NULL,
    order_status INTEGER NOT NULL,
    base_currency INTEGER NOT NULL,
    total_amount_base_currency NUMERIC(10, 2) NOT NULL,
    generated_points INTEGER NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status INTEGER NOT NULL,
    CHECK (total_amount_base_currency >= 0),
    CHECK (generated_points >= 0)
);

CREATE TABLE order_lines (
    id SERIAL PRIMARY KEY,
    "order" INTEGER NOT NULL,
    line_type INTEGER NOT NULL,
    product INTEGER,
    combo INTEGER,
    quantity INTEGER NOT NULL,
    original_unit_price NUMERIC(10, 2) NOT NULL, 
    price_modifier INTEGER,
    unit_price NUMERIC(10, 2) NOT NULL,
    applied_exchange_rate INTEGER NOT NULL,
    status INTEGER NOT NULL,
    CHECK (quantity > 0),
    CHECK (original_unit_price >= 0),
    CHECK (unit_price >= 0),
    CHECK (
        (line_type = 1 AND product IS NOT NULL AND combo IS NULL) 
        OR 
        (line_type = 2 AND product IS NULL AND combo IS NOT NULL)
    )
);

CREATE TABLE tickets (
    id SERIAL PRIMARY KEY,
    "order" INTEGER NOT NULL,
    showtime INTEGER NOT NULL,
    seat INTEGER NOT NULL,
    original_price NUMERIC(10, 2) NOT NULL,
    price_modifier INTEGER,
    price NUMERIC(10, 2) NOT NULL,
    applied_exchange_rate INTEGER NOT NULL,
    qr_code VARCHAR(500) NOT NULL,
    validation_time TIMESTAMP,
    status INTEGER NOT NULL,
    CHECK (original_price >= 0),
    CHECK (price >= 0)
);
CREATE UNIQUE INDEX idx_tickets_showtime_seat_uq ON tickets (showtime, seat);
CREATE UNIQUE INDEX idx_tickets_qr_code_uq ON tickets (qr_code);

CREATE TABLE order_payments (
    id SERIAL PRIMARY KEY,
    "order" INTEGER NOT NULL,
    payment_method INTEGER NOT NULL,
    amount NUMERIC(10, 2) NOT NULL,
    applied_exchange_rate INTEGER NOT NULL,
    reference_number VARCHAR(255),
    is_approved BOOLEAN NOT NULL,
    status INTEGER NOT NULL,
    CHECK (amount > 0)
);
CREATE UNIQUE INDEX idx_order_payments_ref_uq ON order_payments (payment_method, reference_number);

CREATE TABLE loyalty_ledgers (
    id SERIAL PRIMARY KEY,
    customer INTEGER NOT NULL,
    "order" INTEGER,
    operation_type INTEGER NOT NULL,
    points INTEGER NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status INTEGER NOT NULL,
    CHECK (points > 0)
);

-- ==============================================================================
-- FASE 2: DEFINICIÓN DE CLAVES FORÁNEAS
-- ==============================================================================

-- Módulo 1: Catálogos Base
ALTER TABLE operation_types ADD CONSTRAINT fk_operation_types_status FOREIGN KEY (status) REFERENCES statuses(id);

-- Módulo 2: Identidad, Sucursales y RBAC
ALTER TABLE cinemas ADD CONSTRAINT fk_cinemas_status FOREIGN KEY (status) REFERENCES statuses(id);
ALTER TABLE people ADD CONSTRAINT fk_people_gender FOREIGN KEY (gender) REFERENCES genders(id);
ALTER TABLE people ADD CONSTRAINT fk_people_status FOREIGN KEY (status) REFERENCES statuses(id);
ALTER TABLE user_types ADD CONSTRAINT fk_user_types_status FOREIGN KEY (status) REFERENCES statuses(id);
ALTER TABLE roles ADD CONSTRAINT fk_roles_status FOREIGN KEY (status) REFERENCES statuses(id);

ALTER TABLE users ADD CONSTRAINT fk_users_person FOREIGN KEY (person) REFERENCES people(id);
ALTER TABLE users ADD CONSTRAINT fk_users_user_type FOREIGN KEY (user_type) REFERENCES user_types(id);
ALTER TABLE users ADD CONSTRAINT fk_users_role FOREIGN KEY (role) REFERENCES roles(id);
ALTER TABLE users ADD CONSTRAINT fk_users_status FOREIGN KEY (status) REFERENCES statuses(id);

ALTER TABLE employees ADD CONSTRAINT fk_employees_person FOREIGN KEY (person) REFERENCES people(id);
ALTER TABLE employees ADD CONSTRAINT fk_employees_cinema FOREIGN KEY (cinema) REFERENCES cinemas(id);
ALTER TABLE employees ADD CONSTRAINT fk_employees_status FOREIGN KEY (status) REFERENCES statuses(id);

ALTER TABLE customers ADD CONSTRAINT fk_customers_person FOREIGN KEY (person) REFERENCES people(id);
ALTER TABLE customers ADD CONSTRAINT fk_customers_status FOREIGN KEY (status) REFERENCES statuses(id);

ALTER TABLE actions ADD CONSTRAINT fk_actions_status FOREIGN KEY (status) REFERENCES statuses(id);
ALTER TABLE resources ADD CONSTRAINT fk_resources_status FOREIGN KEY (status) REFERENCES statuses(id);
ALTER TABLE permission_types ADD CONSTRAINT fk_permission_types_status FOREIGN KEY (status) REFERENCES statuses(id);

ALTER TABLE permissions ADD CONSTRAINT fk_permissions_action FOREIGN KEY (action) REFERENCES actions(id);
ALTER TABLE permissions ADD CONSTRAINT fk_permissions_resource FOREIGN KEY (resource) REFERENCES resources(id);
ALTER TABLE permissions ADD CONSTRAINT fk_permissions_permission_type FOREIGN KEY (permission_type) REFERENCES permission_types(id);
ALTER TABLE permissions ADD CONSTRAINT fk_permissions_status FOREIGN KEY (status) REFERENCES statuses(id);

ALTER TABLE role_permissions ADD CONSTRAINT fk_role_permissions_role FOREIGN KEY (role) REFERENCES roles(id);
ALTER TABLE role_permissions ADD CONSTRAINT fk_role_permissions_permission FOREIGN KEY (permission) REFERENCES permissions(id);
ALTER TABLE role_permissions ADD CONSTRAINT fk_role_permissions_status FOREIGN KEY (status) REFERENCES statuses(id);

ALTER TABLE role_inheritances ADD CONSTRAINT fk_role_inheritances_parent_role FOREIGN KEY (parent_role) REFERENCES roles(id);
ALTER TABLE role_inheritances ADD CONSTRAINT fk_role_inheritances_child_role FOREIGN KEY (child_role) REFERENCES roles(id);
ALTER TABLE role_inheritances ADD CONSTRAINT fk_role_inheritances_status FOREIGN KEY (status) REFERENCES statuses(id);

ALTER TABLE user_permissions ADD CONSTRAINT fk_user_permissions_user FOREIGN KEY ("user") REFERENCES users(id);
ALTER TABLE user_permissions ADD CONSTRAINT fk_user_permissions_permission FOREIGN KEY (permission) REFERENCES permissions(id);
ALTER TABLE user_permissions ADD CONSTRAINT fk_user_permissions_status FOREIGN KEY (status) REFERENCES statuses(id);

-- Módulo 3: Infraestructura Física
ALTER TABLE projection_types ADD CONSTRAINT fk_projection_types_status FOREIGN KEY (status) REFERENCES statuses(id);

ALTER TABLE rooms ADD CONSTRAINT fk_rooms_cinema FOREIGN KEY (cinema) REFERENCES cinemas(id);
ALTER TABLE rooms ADD CONSTRAINT fk_rooms_status FOREIGN KEY (status) REFERENCES statuses(id);

ALTER TABLE room_projection_types ADD CONSTRAINT fk_room_projection_types_room FOREIGN KEY (room) REFERENCES rooms(id);
ALTER TABLE room_projection_types ADD CONSTRAINT fk_room_projection_types_projection_type FOREIGN KEY (projection_type) REFERENCES projection_types(id);
ALTER TABLE room_projection_types ADD CONSTRAINT fk_room_projection_types_status FOREIGN KEY (status) REFERENCES statuses(id);

ALTER TABLE seat_categories ADD CONSTRAINT fk_seat_categories_status FOREIGN KEY (status) REFERENCES statuses(id);
ALTER TABLE seat_conditions ADD CONSTRAINT fk_seat_conditions_status FOREIGN KEY (status) REFERENCES statuses(id);

ALTER TABLE seats ADD CONSTRAINT fk_seats_room FOREIGN KEY (room) REFERENCES rooms(id);
ALTER TABLE seats ADD CONSTRAINT fk_seats_seat_category FOREIGN KEY (seat_category) REFERENCES seat_categories(id);
ALTER TABLE seats ADD CONSTRAINT fk_seats_seat_condition FOREIGN KEY (seat_condition) REFERENCES seat_conditions(id);
ALTER TABLE seats ADD CONSTRAINT fk_seats_status FOREIGN KEY (status) REFERENCES statuses(id);

-- Módulo 4: Economía y Tasas de Cambio
ALTER TABLE currencies ADD CONSTRAINT fk_currencies_status FOREIGN KEY (status) REFERENCES statuses(id);

ALTER TABLE exchange_rates ADD CONSTRAINT fk_exchange_rates_currency FOREIGN KEY (currency) REFERENCES currencies(id);
ALTER TABLE exchange_rates ADD CONSTRAINT fk_exchange_rates_user FOREIGN KEY ("user") REFERENCES users(id);
ALTER TABLE exchange_rates ADD CONSTRAINT fk_exchange_rates_status FOREIGN KEY (status) REFERENCES statuses(id);

-- Módulo 5: Cartelera y Motor de Precios
ALTER TABLE genres ADD CONSTRAINT fk_genres_status FOREIGN KEY (status) REFERENCES statuses(id);
ALTER TABLE age_classifications ADD CONSTRAINT fk_age_classifications_status FOREIGN KEY (status) REFERENCES statuses(id);
ALTER TABLE movie_lifecycle_states ADD CONSTRAINT fk_movie_lifecycle_states_status FOREIGN KEY (status) REFERENCES statuses(id);

ALTER TABLE movies ADD CONSTRAINT fk_movies_age_classification FOREIGN KEY (age_classification) REFERENCES age_classifications(id);
ALTER TABLE movies ADD CONSTRAINT fk_movies_lifecycle_state FOREIGN KEY (lifecycle_state) REFERENCES movie_lifecycle_states(id);
ALTER TABLE movies ADD CONSTRAINT fk_movies_status FOREIGN KEY (status) REFERENCES statuses(id);

ALTER TABLE movie_genres ADD CONSTRAINT fk_movie_genres_movie FOREIGN KEY (movie) REFERENCES movies(id);
ALTER TABLE movie_genres ADD CONSTRAINT fk_movie_genres_genre FOREIGN KEY (genre) REFERENCES genres(id);
ALTER TABLE movie_genres ADD CONSTRAINT fk_movie_genres_status FOREIGN KEY (status) REFERENCES statuses(id);

ALTER TABLE movie_subscriptions ADD CONSTRAINT fk_movie_subscriptions_customer FOREIGN KEY (customer) REFERENCES customers(id);
ALTER TABLE movie_subscriptions ADD CONSTRAINT fk_movie_subscriptions_movie FOREIGN KEY (movie) REFERENCES movies(id);
ALTER TABLE movie_subscriptions ADD CONSTRAINT fk_movie_subscriptions_status FOREIGN KEY (status) REFERENCES statuses(id);

ALTER TABLE showtimes ADD CONSTRAINT fk_showtimes_movie FOREIGN KEY (movie) REFERENCES movies(id);
ALTER TABLE showtimes ADD CONSTRAINT fk_showtimes_room FOREIGN KEY (room) REFERENCES rooms(id);
ALTER TABLE showtimes ADD CONSTRAINT fk_showtimes_projection_type FOREIGN KEY (projection_type) REFERENCES projection_types(id);
ALTER TABLE showtimes ADD CONSTRAINT fk_showtimes_currency FOREIGN KEY (currency) REFERENCES currencies(id);
ALTER TABLE showtimes ADD CONSTRAINT fk_showtimes_status FOREIGN KEY (status) REFERENCES statuses(id);

ALTER TABLE audience_categories ADD CONSTRAINT fk_audience_categories_status FOREIGN KEY (status) REFERENCES statuses(id);
ALTER TABLE week_days ADD CONSTRAINT fk_week_days_status FOREIGN KEY (status) REFERENCES statuses(id);
ALTER TABLE modifier_scopes ADD CONSTRAINT fk_modifier_scopes_status FOREIGN KEY (status) REFERENCES statuses(id);

ALTER TABLE price_modifiers ADD CONSTRAINT fk_price_modifiers_modifier_scope FOREIGN KEY (modifier_scope) REFERENCES modifier_scopes(id);
ALTER TABLE price_modifiers ADD CONSTRAINT fk_price_modifiers_audience_category FOREIGN KEY (audience_category) REFERENCES audience_categories(id);
ALTER TABLE price_modifiers ADD CONSTRAINT fk_price_modifiers_week_day FOREIGN KEY (week_day) REFERENCES week_days(id);
ALTER TABLE price_modifiers ADD CONSTRAINT fk_price_modifiers_seat_category FOREIGN KEY (seat_category) REFERENCES seat_categories(id);
ALTER TABLE price_modifiers ADD CONSTRAINT fk_price_modifiers_projection_type FOREIGN KEY (projection_type) REFERENCES projection_types(id);
ALTER TABLE price_modifiers ADD CONSTRAINT fk_price_modifiers_product_category FOREIGN KEY (product_category) REFERENCES product_categories(id);
ALTER TABLE price_modifiers ADD CONSTRAINT fk_price_modifiers_product FOREIGN KEY (product) REFERENCES products(id);
ALTER TABLE price_modifiers ADD CONSTRAINT fk_price_modifiers_combo FOREIGN KEY (combo) REFERENCES combos(id);
ALTER TABLE price_modifiers ADD CONSTRAINT fk_price_modifiers_operation_type FOREIGN KEY (operation_type) REFERENCES operation_types(id);
ALTER TABLE price_modifiers ADD CONSTRAINT fk_price_modifiers_status FOREIGN KEY (status) REFERENCES statuses(id);

-- Módulo 6: Inventario y Combos
ALTER TABLE product_categories ADD CONSTRAINT fk_product_categories_status FOREIGN KEY (status) REFERENCES statuses(id);

ALTER TABLE products ADD CONSTRAINT fk_products_product_category FOREIGN KEY (product_category) REFERENCES product_categories(id);
ALTER TABLE products ADD CONSTRAINT fk_products_currency FOREIGN KEY (currency) REFERENCES currencies(id);
ALTER TABLE products ADD CONSTRAINT fk_products_status FOREIGN KEY (status) REFERENCES statuses(id);

ALTER TABLE combos ADD CONSTRAINT fk_combos_currency FOREIGN KEY (currency) REFERENCES currencies(id);
ALTER TABLE combos ADD CONSTRAINT fk_combos_status FOREIGN KEY (status) REFERENCES statuses(id);

ALTER TABLE combo_products ADD CONSTRAINT fk_combo_products_combo FOREIGN KEY (combo) REFERENCES combos(id);
ALTER TABLE combo_products ADD CONSTRAINT fk_combo_products_product FOREIGN KEY (product) REFERENCES products(id);
ALTER TABLE combo_products ADD CONSTRAINT fk_combo_products_status FOREIGN KEY (status) REFERENCES statuses(id);

ALTER TABLE inventories ADD CONSTRAINT fk_inventories_cinema FOREIGN KEY (cinema) REFERENCES cinemas(id);
ALTER TABLE inventories ADD CONSTRAINT fk_inventories_product FOREIGN KEY (product) REFERENCES products(id);
ALTER TABLE inventories ADD CONSTRAINT fk_inventories_status FOREIGN KEY (status) REFERENCES statuses(id);

ALTER TABLE inventory_movements ADD CONSTRAINT fk_inventory_movements_inventory FOREIGN KEY (inventory) REFERENCES inventories(id);
ALTER TABLE inventory_movements ADD CONSTRAINT fk_inventory_movements_operation_type FOREIGN KEY (operation_type) REFERENCES operation_types(id);
ALTER TABLE inventory_movements ADD CONSTRAINT fk_inventory_movements_user FOREIGN KEY ("user") REFERENCES users(id);
ALTER TABLE inventory_movements ADD CONSTRAINT fk_inventory_movements_status FOREIGN KEY (status) REFERENCES statuses(id);

-- Módulo 7: Transacciones, Pagos y Fidelidad
ALTER TABLE order_statuses ADD CONSTRAINT fk_order_statuses_status FOREIGN KEY (status) REFERENCES statuses(id);
ALTER TABLE payment_methods ADD CONSTRAINT fk_payment_methods_status FOREIGN KEY (status) REFERENCES statuses(id);
ALTER TABLE line_types ADD CONSTRAINT fk_line_types_status FOREIGN KEY (status) REFERENCES statuses(id);

ALTER TABLE orders ADD CONSTRAINT fk_orders_customer FOREIGN KEY (customer) REFERENCES customers(id);
ALTER TABLE orders ADD CONSTRAINT fk_orders_employee FOREIGN KEY (employee) REFERENCES employees(id);
ALTER TABLE orders ADD CONSTRAINT fk_orders_cinema FOREIGN KEY (cinema) REFERENCES cinemas(id);
ALTER TABLE orders ADD CONSTRAINT fk_orders_order_status FOREIGN KEY (order_status) REFERENCES order_statuses(id);
ALTER TABLE orders ADD CONSTRAINT fk_orders_base_currency FOREIGN KEY (base_currency) REFERENCES currencies(id);
ALTER TABLE orders ADD CONSTRAINT fk_orders_status FOREIGN KEY (status) REFERENCES statuses(id);

ALTER TABLE order_lines ADD CONSTRAINT fk_order_lines_order FOREIGN KEY ("order") REFERENCES orders(id);
ALTER TABLE order_lines ADD CONSTRAINT fk_order_lines_line_type FOREIGN KEY (line_type) REFERENCES line_types(id);
ALTER TABLE order_lines ADD CONSTRAINT fk_order_lines_product FOREIGN KEY (product) REFERENCES products(id);
ALTER TABLE order_lines ADD CONSTRAINT fk_order_lines_combo FOREIGN KEY (combo) REFERENCES combos(id);
ALTER TABLE order_lines ADD CONSTRAINT fk_order_lines_price_modifier FOREIGN KEY (price_modifier) REFERENCES price_modifiers(id);
ALTER TABLE order_lines ADD CONSTRAINT fk_order_lines_applied_exchange_rate FOREIGN KEY (applied_exchange_rate) REFERENCES exchange_rates(id);
ALTER TABLE order_lines ADD CONSTRAINT fk_order_lines_status FOREIGN KEY (status) REFERENCES statuses(id);

ALTER TABLE tickets ADD CONSTRAINT fk_tickets_order FOREIGN KEY ("order") REFERENCES orders(id);
ALTER TABLE tickets ADD CONSTRAINT fk_tickets_showtime FOREIGN KEY (showtime) REFERENCES showtimes(id);
ALTER TABLE tickets ADD CONSTRAINT fk_tickets_seat FOREIGN KEY (seat) REFERENCES seats(id);
ALTER TABLE tickets ADD CONSTRAINT fk_tickets_price_modifier FOREIGN KEY (price_modifier) REFERENCES price_modifiers(id);
ALTER TABLE tickets ADD CONSTRAINT fk_tickets_applied_exchange_rate FOREIGN KEY (applied_exchange_rate) REFERENCES exchange_rates(id);
ALTER TABLE tickets ADD CONSTRAINT fk_tickets_status FOREIGN KEY (status) REFERENCES statuses(id);

ALTER TABLE order_payments ADD CONSTRAINT fk_order_payments_order FOREIGN KEY ("order") REFERENCES orders(id);
ALTER TABLE order_payments ADD CONSTRAINT fk_order_payments_payment_method FOREIGN KEY (payment_method) REFERENCES payment_methods(id);
ALTER TABLE order_payments ADD CONSTRAINT fk_order_payments_applied_exchange_rate FOREIGN KEY (applied_exchange_rate) REFERENCES exchange_rates(id);
ALTER TABLE order_payments ADD CONSTRAINT fk_order_payments_status FOREIGN KEY (status) REFERENCES statuses(id);

ALTER TABLE loyalty_ledgers ADD CONSTRAINT fk_loyalty_ledgers_customer FOREIGN KEY (customer) REFERENCES customers(id);
ALTER TABLE loyalty_ledgers ADD CONSTRAINT fk_loyalty_ledgers_order FOREIGN KEY ("order") REFERENCES orders(id);
ALTER TABLE loyalty_ledgers ADD CONSTRAINT fk_loyalty_ledgers_operation_type FOREIGN KEY (operation_type) REFERENCES operation_types(id);
ALTER TABLE loyalty_ledgers ADD CONSTRAINT fk_loyalty_ledgers_status FOREIGN KEY (status) REFERENCES statuses(id);