CREATE TABLE public.actions (
    id integer NOT NULL,
    code character varying(100) NOT NULL,
    description character varying(255) NOT NULL,
    status integer DEFAULT 1 NOT NULL
);

CREATE TABLE public.age_classifications (
    id integer NOT NULL,
    description character varying(255) NOT NULL,
    status integer DEFAULT 1 NOT NULL
);

CREATE TABLE public.audience_categories (
    id integer NOT NULL,
    description character varying(255) NOT NULL,
    status integer DEFAULT 1 NOT NULL
);

CREATE TABLE public.catalog_audit_logs (
    id bigint NOT NULL,
    table_name character varying(100) NOT NULL,
    record_id integer NOT NULL,
    action character varying(10) NOT NULL,
    changed_by integer,
    previous_data jsonb,
    new_data jsonb,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE public.cinemas (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    address text,
    phone character varying(50),
    opening_time time without time zone NOT NULL,
    closing_time time without time zone NOT NULL,
    status integer DEFAULT 1 NOT NULL,
    CONSTRAINT chk_cinemas_times CHECK ((closing_time > opening_time))
);

CREATE TABLE public.combo_products (
    id integer NOT NULL,
    combo integer NOT NULL,
    product integer NOT NULL,
    quantity integer NOT NULL,
    status integer DEFAULT 1 NOT NULL,
    CONSTRAINT chk_combo_products_qty CHECK ((quantity > 0))
);

CREATE TABLE public.combos (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    sku character varying(100) NOT NULL,
    description character varying(255) NOT NULL,
    currency integer NOT NULL,
    price numeric(10,2) NOT NULL,
    earned_loyalty_points integer,
    status integer DEFAULT 1 NOT NULL
);

CREATE TABLE public.currencies (
    id integer NOT NULL,
    code character varying(10) NOT NULL,
    description character varying(255) NOT NULL,
    symbol character varying(10) NOT NULL,
    is_base_currency boolean NOT NULL,
    status integer DEFAULT 1 NOT NULL
);

CREATE TABLE public.customers (
    id integer NOT NULL,
    person integer NOT NULL,
    loyalty_level integer DEFAULT 1 NOT NULL,
    level_progress_points integer DEFAULT 0 NOT NULL,
    registration_date timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    status integer DEFAULT 1 NOT NULL,
    CONSTRAINT chk_customers_progress CHECK ((level_progress_points >= 0))
);

CREATE TABLE public.employee_positions (
    id integer NOT NULL,
    employee integer NOT NULL,
    job_position integer NOT NULL,
    cinema integer NOT NULL,
    start_date date NOT NULL,
    end_date date,
    salary_base numeric(10,2),
    status integer DEFAULT 1 NOT NULL,
    CONSTRAINT chk_employee_positions_dates CHECK (((end_date IS NULL) OR (end_date >= start_date)))
);

CREATE TABLE public.employees (
    id integer NOT NULL,
    person integer NOT NULL,
    employee_code character varying(50) NOT NULL,
    status integer DEFAULT 1 NOT NULL
);

CREATE TABLE public.exchange_rates (
    id integer NOT NULL,
    currency integer NOT NULL,
    rate numeric(10,2) NOT NULL,
    "user" integer NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    status integer DEFAULT 1 NOT NULL,
    CONSTRAINT chk_exchange_rates_rate CHECK ((rate > (0)::numeric))
);

CREATE TABLE public.genders (
    id integer NOT NULL,
    description character varying(255) NOT NULL,
    status integer DEFAULT 1 NOT NULL
);

CREATE TABLE public.genres (
    id integer NOT NULL,
    description character varying(255) NOT NULL,
    status integer DEFAULT 1 NOT NULL
);

CREATE TABLE public.inventories (
    id integer NOT NULL,
    cinema integer NOT NULL,
    product integer NOT NULL,
    stock integer NOT NULL,
    status integer DEFAULT 1 NOT NULL,
    CONSTRAINT chk_inventories_stock CHECK ((stock >= 0))
);

CREATE TABLE public.inventory_movements (
    id integer NOT NULL,
    inventory integer NOT NULL,
    operation_type integer NOT NULL,
    quantity integer NOT NULL,
    "user" integer NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    remarks character varying(255),
    status integer DEFAULT 1 NOT NULL,
    CONSTRAINT chk_inventory_movements_qty CHECK ((quantity > 0))
);

CREATE TABLE public.job_positions (
    id integer NOT NULL,
    title character varying(255) NOT NULL,
    description character varying(255),
    is_pensionable boolean DEFAULT false NOT NULL,
    status integer DEFAULT 1 NOT NULL
);

CREATE TABLE public.line_types (
    id integer NOT NULL,
    description character varying(255) NOT NULL,
    status integer DEFAULT 1 NOT NULL
);

CREATE TABLE public.loyalty_ledgers (
    id integer NOT NULL,
    customer integer NOT NULL,
    "order" integer,
    operation_type integer NOT NULL,
    points integer NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    status integer DEFAULT 1 NOT NULL,
    CONSTRAINT chk_loyalty_ledgers_pts CHECK ((points > 0))
);

CREATE TABLE public.loyalty_levels (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    required_points integer,
    status integer DEFAULT 1 NOT NULL,
    CONSTRAINT chk_loyalty_levels_pts CHECK ((required_points >= 0))
);

CREATE TABLE public.modifier_scopes (
    id integer NOT NULL,
    description character varying(255) NOT NULL,
    status integer DEFAULT 1 NOT NULL
);

CREATE TABLE public.movie_genres (
    id integer NOT NULL,
    movie integer NOT NULL,
    genre integer NOT NULL,
    status integer DEFAULT 1 NOT NULL
);

CREATE TABLE public.movie_lifecycle_states (
    id integer NOT NULL,
    description character varying(255) NOT NULL,
    status integer DEFAULT 1 NOT NULL
);

CREATE TABLE public.movie_subscriptions (
    id integer NOT NULL,
    customer integer NOT NULL,
    movie integer NOT NULL,
    is_notified boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    status integer DEFAULT 1 NOT NULL
);

CREATE TABLE public.movies (
    id integer NOT NULL,
    title character varying(255) NOT NULL,
    duration_minutes integer NOT NULL,
    age_classification integer NOT NULL,
    lifecycle_state integer NOT NULL,
    synopsis text NOT NULL,
    trailer_url character varying(255),
    poster_url character varying(255),
    banner_url character varying(255),
    release_date date NOT NULL,
    status integer DEFAULT 1 NOT NULL,
    CONSTRAINT chk_movies_duration CHECK ((duration_minutes > 0))
);

CREATE TABLE public.operation_types (
    id integer NOT NULL,
    description character varying(255) NOT NULL,
    is_increment boolean NOT NULL,
    status integer DEFAULT 1 NOT NULL
);

CREATE TABLE public.order_lines (
    id integer NOT NULL,
    "order" integer NOT NULL,
    line_type integer NOT NULL,
    product integer,
    combo integer,
    quantity integer NOT NULL,
    original_unit_price numeric(10,2) NOT NULL,
    price_modifier integer,
    unit_price numeric(10,2) NOT NULL,
    applied_exchange_rate integer NOT NULL,
    status integer DEFAULT 1 NOT NULL,
    CONSTRAINT chk_order_lines_logic CHECK (((quantity > 0) AND (original_unit_price >= (0)::numeric) AND (unit_price >= (0)::numeric) AND (((line_type = 1) AND (product IS NOT NULL) AND (combo IS NULL)) OR ((line_type = 2) AND (product IS NULL) AND (combo IS NOT NULL)))))
);

CREATE TABLE public.order_payments (
    id integer NOT NULL,
    "order" integer NOT NULL,
    payment_method integer NOT NULL,
    amount numeric(10,2) NOT NULL,
    applied_exchange_rate integer NOT NULL,
    reference_number character varying(255),
    is_approved boolean NOT NULL,
    status integer DEFAULT 1 NOT NULL,
    CONSTRAINT chk_order_payments_amt CHECK ((amount > (0)::numeric))
);

CREATE TABLE public.order_statuses (
    id integer NOT NULL,
    description character varying(255) NOT NULL,
    status integer DEFAULT 1 NOT NULL
);

CREATE TABLE public.orders (
    id integer NOT NULL,
    customer integer NOT NULL,
    employee_position integer,
    cinema integer NOT NULL,
    order_status integer DEFAULT 1 NOT NULL,
    base_currency integer NOT NULL,
    total_amount_base_currency numeric(10,2) NOT NULL,
    generated_points integer NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    status integer DEFAULT 1 NOT NULL,
    CONSTRAINT chk_orders_amounts CHECK (((total_amount_base_currency >= (0)::numeric) AND (generated_points >= 0)))
);

CREATE TABLE public.payment_methods (
    id integer NOT NULL,
    description character varying(255) NOT NULL,
    requires_reference boolean NOT NULL,
    status integer DEFAULT 1 NOT NULL
);

CREATE TABLE public.people (
    id integer NOT NULL,
    document_number character varying(50) NOT NULL,
    first_name character varying(255) NOT NULL,
    last_name character varying(255) NOT NULL,
    gender integer,
    phone_number character varying(50),
    personal_email character varying(100),
    birth_date date,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone,
    status integer DEFAULT 1 NOT NULL
);

CREATE TABLE public.permission_types (
    id integer NOT NULL,
    code character varying(100) NOT NULL,
    description character varying(255) NOT NULL,
    status integer DEFAULT 1 NOT NULL
);

CREATE TABLE public.permissions (
    id integer NOT NULL,
    action integer NOT NULL,
    resource integer NOT NULL,
    permission_type integer NOT NULL,
    status integer DEFAULT 1 NOT NULL
);

CREATE TABLE public.price_modifiers (
    id integer NOT NULL,
    description character varying(255) NOT NULL,
    modifier_scope integer NOT NULL,
    audience_category integer,
    week_day integer,
    seat_category integer,
    projection_type integer,
    product_category integer,
    product integer,
    combo integer,
    operation_type integer NOT NULL,
    is_percentage boolean NOT NULL,
    value numeric(10,2) NOT NULL,
    status integer DEFAULT 1 NOT NULL,
    CONSTRAINT chk_price_modifiers_logic CHECK (((value > (0)::numeric) AND (((modifier_scope = 1) AND (product_category IS NULL) AND (product IS NULL) AND (combo IS NULL)) OR ((modifier_scope = 2) AND (audience_category IS NULL) AND (seat_category IS NULL) AND (projection_type IS NULL)) OR ((modifier_scope = 3) AND (product_category IS NULL) AND (product IS NULL) AND (combo IS NULL) AND (audience_category IS NULL) AND (seat_category IS NULL) AND (projection_type IS NULL)))))
);

CREATE TABLE public.product_categories (
    id integer NOT NULL,
    description character varying(255) NOT NULL,
    status integer DEFAULT 1 NOT NULL
);

CREATE TABLE public.products (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    sku character varying(100) NOT NULL,
    product_category integer NOT NULL,
    currency integer NOT NULL,
    price numeric(10,2) NOT NULL,
    earned_loyalty_points integer,
    status integer DEFAULT 1 NOT NULL
);

CREATE TABLE public.projection_types (
    id integer NOT NULL,
    description character varying(255) NOT NULL,
    status integer DEFAULT 1 NOT NULL
);

CREATE TABLE public.resources (
    id integer NOT NULL,
    code character varying(100) NOT NULL,
    description character varying(255) NOT NULL,
    status integer DEFAULT 1 NOT NULL
);

CREATE TABLE public.role_inheritances (
    id integer NOT NULL,
    parent_role integer NOT NULL,
    child_role integer NOT NULL,
    status integer DEFAULT 1 NOT NULL,
    CONSTRAINT chk_role_inheritances_diff CHECK ((parent_role <> child_role))
);

CREATE TABLE public.role_permissions (
    id integer NOT NULL,
    role integer NOT NULL,
    permission integer NOT NULL,
    status integer DEFAULT 1 NOT NULL
);

CREATE TABLE public.roles (
    id integer NOT NULL,
    code character varying(50) NOT NULL,
    name character varying(100) NOT NULL,
    description character varying(255) NOT NULL,
    status integer DEFAULT 1 NOT NULL
);

CREATE TABLE public.room_projection_types (
    id integer NOT NULL,
    room integer NOT NULL,
    projection_type integer NOT NULL,
    status integer DEFAULT 1 NOT NULL
);

CREATE TABLE public.rooms (
    id integer NOT NULL,
    cinema integer NOT NULL,
    name character varying(100) NOT NULL,
    grid_rows integer NOT NULL,
    grid_columns integer NOT NULL,
    total_capacity integer NOT NULL,
    status integer DEFAULT 1 NOT NULL,
    CONSTRAINT chk_rooms_capacity CHECK (((grid_rows > 0) AND (grid_columns > 0) AND (total_capacity >= 0)))
);

CREATE TABLE public.seat_categories (
    id integer NOT NULL,
    description character varying(255) NOT NULL,
    status integer DEFAULT 1 NOT NULL
);

CREATE TABLE public.seat_conditions (
    id integer NOT NULL,
    description character varying(255) NOT NULL,
    status integer DEFAULT 1 NOT NULL
);

CREATE TABLE public.seats (
    id integer NOT NULL,
    room integer NOT NULL,
    row_identifier character varying(2) NOT NULL,
    column_number integer NOT NULL,
    seat_category integer NOT NULL,
    seat_condition integer NOT NULL,
    status integer DEFAULT 1 NOT NULL,
    CONSTRAINT chk_seats_col CHECK ((column_number > 0))
);

CREATE TABLE public.showtimes (
    id integer NOT NULL,
    movie integer NOT NULL,
    room integer NOT NULL,
    projection_type integer NOT NULL,
    start_time timestamp with time zone NOT NULL,
    end_time timestamp with time zone NOT NULL,
    currency integer NOT NULL,
    price numeric(10,2) NOT NULL,
    earned_loyalty_points integer,
    status integer DEFAULT 1 NOT NULL,
    CONSTRAINT chk_showtimes_times CHECK (((end_time > start_time) AND (price >= (0)::numeric)))
);

CREATE TABLE public.statuses (
    id integer NOT NULL,
    description character varying(255) NOT NULL
);

CREATE TABLE public.tickets (
    id integer NOT NULL,
    "order" integer NOT NULL,
    showtime integer NOT NULL,
    seat integer NOT NULL,
    original_price numeric(10,2) NOT NULL,
    price_modifier integer,
    price numeric(10,2) NOT NULL,
    applied_exchange_rate integer NOT NULL,
    qr_code character varying(500) NOT NULL,
    validation_time timestamp with time zone,
    status integer DEFAULT 1 NOT NULL,
    CONSTRAINT chk_tickets_prices CHECK (((original_price >= (0)::numeric) AND (price >= (0)::numeric)))
);

CREATE TABLE public.user_permissions (
    id integer NOT NULL,
    "user" integer NOT NULL,
    permission integer NOT NULL,
    is_granted boolean NOT NULL,
    status integer DEFAULT 1 NOT NULL
);

CREATE TABLE public.user_types (
    id integer NOT NULL,
    description character varying(255) NOT NULL,
    status integer DEFAULT 1 NOT NULL
);

CREATE TABLE public.users (
    id integer NOT NULL,
    person integer NOT NULL,
    user_type integer NOT NULL,
    role integer,
    email character varying(100) NOT NULL,
    password character varying(255) NOT NULL,
    last_login timestamp with time zone,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone,
    status integer DEFAULT 1 NOT NULL,
    CONSTRAINT chk_users_role CHECK ((((user_type = 1) AND (role IS NOT NULL)) OR ((user_type = 2) AND (role IS NULL))))
);

CREATE TABLE public.users_logins (
    id integer NOT NULL,
    "user" integer NOT NULL,
    device character varying(500),
    jti character varying(255) NOT NULL,
    token_status integer DEFAULT 1 NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone,
    status integer DEFAULT 1 NOT NULL
);

CREATE TABLE public.week_days (
    id integer NOT NULL,
    description character varying(50) NOT NULL,
    day_number integer NOT NULL,
    status integer DEFAULT 1 NOT NULL,
    CONSTRAINT chk_week_days_range CHECK (((day_number >= 1) AND (day_number <= 7)))
);

ALTER TABLE public.actions
    ADD CONSTRAINT actions_pkey PRIMARY KEY (id);


ALTER TABLE public.age_classifications
    ADD CONSTRAINT age_classifications_pkey PRIMARY KEY (id);


ALTER TABLE public.audience_categories
    ADD CONSTRAINT audience_categories_pkey PRIMARY KEY (id);


ALTER TABLE public.catalog_audit_logs
    ADD CONSTRAINT catalog_audit_logs_pkey PRIMARY KEY (id);


ALTER TABLE public.cinemas
    ADD CONSTRAINT cinemas_pkey PRIMARY KEY (id);


ALTER TABLE public.combo_products
    ADD CONSTRAINT combo_products_pkey PRIMARY KEY (id);


ALTER TABLE public.combos
    ADD CONSTRAINT combos_pkey PRIMARY KEY (id);


ALTER TABLE public.currencies
    ADD CONSTRAINT currencies_pkey PRIMARY KEY (id);


ALTER TABLE public.customers
    ADD CONSTRAINT customers_pkey PRIMARY KEY (id);


ALTER TABLE public.employee_positions
    ADD CONSTRAINT employee_positions_pkey PRIMARY KEY (id);


ALTER TABLE public.employees
    ADD CONSTRAINT employees_pkey PRIMARY KEY (id);


ALTER TABLE public.exchange_rates
    ADD CONSTRAINT exchange_rates_pkey PRIMARY KEY (id);


ALTER TABLE public.genders
    ADD CONSTRAINT genders_pkey PRIMARY KEY (id);


ALTER TABLE public.genres
    ADD CONSTRAINT genres_pkey PRIMARY KEY (id);


ALTER TABLE public.inventories
    ADD CONSTRAINT inventories_pkey PRIMARY KEY (id);


ALTER TABLE public.inventory_movements
    ADD CONSTRAINT inventory_movements_pkey PRIMARY KEY (id);


ALTER TABLE public.job_positions
    ADD CONSTRAINT job_positions_pkey PRIMARY KEY (id);


ALTER TABLE public.line_types
    ADD CONSTRAINT line_types_pkey PRIMARY KEY (id);


ALTER TABLE public.loyalty_ledgers
    ADD CONSTRAINT loyalty_ledgers_pkey PRIMARY KEY (id);


ALTER TABLE public.loyalty_levels
    ADD CONSTRAINT loyalty_levels_pkey PRIMARY KEY (id);


ALTER TABLE public.modifier_scopes
    ADD CONSTRAINT modifier_scopes_pkey PRIMARY KEY (id);


ALTER TABLE public.movie_genres
    ADD CONSTRAINT movie_genres_pkey PRIMARY KEY (id);


ALTER TABLE public.movie_lifecycle_states
    ADD CONSTRAINT movie_lifecycle_states_pkey PRIMARY KEY (id);


ALTER TABLE public.movie_subscriptions
    ADD CONSTRAINT movie_subscriptions_pkey PRIMARY KEY (id);


ALTER TABLE public.movies
    ADD CONSTRAINT movies_pkey PRIMARY KEY (id);


ALTER TABLE public.operation_types
    ADD CONSTRAINT operation_types_pkey PRIMARY KEY (id);


ALTER TABLE public.order_lines
    ADD CONSTRAINT order_lines_pkey PRIMARY KEY (id);


ALTER TABLE public.order_payments
    ADD CONSTRAINT order_payments_pkey PRIMARY KEY (id);


ALTER TABLE public.order_statuses
    ADD CONSTRAINT order_statuses_pkey PRIMARY KEY (id);


ALTER TABLE public.orders
    ADD CONSTRAINT orders_pkey PRIMARY KEY (id);


ALTER TABLE public.payment_methods
    ADD CONSTRAINT payment_methods_pkey PRIMARY KEY (id);


ALTER TABLE public.people
    ADD CONSTRAINT people_pkey PRIMARY KEY (id);


ALTER TABLE public.permission_types
    ADD CONSTRAINT permission_types_pkey PRIMARY KEY (id);


ALTER TABLE public.permissions
    ADD CONSTRAINT permissions_pkey PRIMARY KEY (id);


ALTER TABLE public.price_modifiers
    ADD CONSTRAINT price_modifiers_pkey PRIMARY KEY (id);


ALTER TABLE public.product_categories
    ADD CONSTRAINT product_categories_pkey PRIMARY KEY (id);


ALTER TABLE public.products
    ADD CONSTRAINT products_pkey PRIMARY KEY (id);


ALTER TABLE public.projection_types
    ADD CONSTRAINT projection_types_pkey PRIMARY KEY (id);


ALTER TABLE public.resources
    ADD CONSTRAINT resources_pkey PRIMARY KEY (id);


ALTER TABLE public.role_inheritances
    ADD CONSTRAINT role_inheritances_pkey PRIMARY KEY (id);


ALTER TABLE public.role_permissions
    ADD CONSTRAINT role_permissions_pkey PRIMARY KEY (id);


ALTER TABLE public.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (id);


ALTER TABLE public.room_projection_types
    ADD CONSTRAINT room_projection_types_pkey PRIMARY KEY (id);


ALTER TABLE public.rooms
    ADD CONSTRAINT rooms_pkey PRIMARY KEY (id);


ALTER TABLE public.seat_categories
    ADD CONSTRAINT seat_categories_pkey PRIMARY KEY (id);


ALTER TABLE public.seat_conditions
    ADD CONSTRAINT seat_conditions_pkey PRIMARY KEY (id);


ALTER TABLE public.seats
    ADD CONSTRAINT seats_pkey PRIMARY KEY (id);


ALTER TABLE public.showtimes
    ADD CONSTRAINT showtimes_pkey PRIMARY KEY (id);


ALTER TABLE public.statuses
    ADD CONSTRAINT statuses_pkey PRIMARY KEY (id);


ALTER TABLE public.tickets
    ADD CONSTRAINT tickets_pkey PRIMARY KEY (id);


ALTER TABLE public.user_permissions
    ADD CONSTRAINT user_permissions_pkey PRIMARY KEY (id);


ALTER TABLE public.user_types
    ADD CONSTRAINT user_types_pkey PRIMARY KEY (id);


ALTER TABLE public.users_logins
    ADD CONSTRAINT users_logins_pkey PRIMARY KEY (id);


ALTER TABLE public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


ALTER TABLE public.week_days
    ADD CONSTRAINT week_days_pkey PRIMARY KEY (id);

CREATE UNIQUE INDEX idx_actions_code_uq ON public.actions USING btree (code);

CREATE UNIQUE INDEX idx_age_classifications_description_uq ON public.age_classifications USING btree (description);

CREATE UNIQUE INDEX idx_audience_categories_description_uq ON public.audience_categories USING btree (description);

CREATE INDEX idx_audit_logs_changed_by ON public.catalog_audit_logs USING btree (changed_by);

CREATE INDEX idx_audit_logs_created_at ON public.catalog_audit_logs USING btree (created_at);

CREATE INDEX idx_audit_logs_record_id ON public.catalog_audit_logs USING btree (record_id);

CREATE INDEX idx_audit_logs_table_name ON public.catalog_audit_logs USING btree (table_name);

CREATE INDEX idx_audit_logs_table_record ON public.catalog_audit_logs USING btree (table_name, record_id);

CREATE UNIQUE INDEX idx_cinemas_name_uq ON public.cinemas USING btree (name);

CREATE UNIQUE INDEX idx_combo_products_uq ON public.combo_products USING btree (combo, product);

CREATE UNIQUE INDEX idx_combos_sku_uq ON public.combos USING btree (sku);

CREATE UNIQUE INDEX idx_currencies_code_uq ON public.currencies USING btree (code);

CREATE UNIQUE INDEX idx_customers_people_uq ON public.customers USING btree (person);

CREATE UNIQUE INDEX idx_employees_code_uq ON public.employees USING btree (employee_code);

CREATE UNIQUE INDEX idx_employees_people_uq ON public.employees USING btree (person);

CREATE UNIQUE INDEX idx_genders_description_uq ON public.genders USING btree (description);

CREATE UNIQUE INDEX idx_genres_description_uq ON public.genres USING btree (description);

CREATE UNIQUE INDEX idx_inventories_cinema_product_uq ON public.inventories USING btree (cinema, product);

CREATE UNIQUE INDEX idx_job_positions_title_uq ON public.job_positions USING btree (title);

CREATE UNIQUE INDEX idx_line_types_uq ON public.line_types USING btree (description);

CREATE UNIQUE INDEX idx_loyalty_levels_name_uq ON public.loyalty_levels USING btree (name);

CREATE UNIQUE INDEX idx_modifier_scopes_description_uq ON public.modifier_scopes USING btree (description);

CREATE UNIQUE INDEX idx_movie_genres_uq ON public.movie_genres USING btree (movie, genre);

CREATE UNIQUE INDEX idx_movie_lifecycle_states_description_uq ON public.movie_lifecycle_states USING btree (description);

CREATE UNIQUE INDEX idx_movie_subscriptions_uq ON public.movie_subscriptions USING btree (customer, movie);

CREATE UNIQUE INDEX idx_movies_title_uq ON public.movies USING btree (title);

CREATE UNIQUE INDEX idx_operation_types_description_uq ON public.operation_types USING btree (description);

CREATE UNIQUE INDEX idx_order_payments_ref_uq ON public.order_payments USING btree (payment_method, reference_number);

CREATE UNIQUE INDEX idx_order_statuses_uq ON public.order_statuses USING btree (description);

CREATE UNIQUE INDEX idx_payment_methods_uq ON public.payment_methods USING btree (description);

CREATE UNIQUE INDEX idx_people_document_number_uq ON public.people USING btree (document_number);

CREATE UNIQUE INDEX idx_permission_types_code_uq ON public.permission_types USING btree (code);

CREATE UNIQUE INDEX idx_permissions_uq ON public.permissions USING btree (action, resource, permission_type);

CREATE UNIQUE INDEX idx_product_categories_name_uq ON public.product_categories USING btree (description);

CREATE UNIQUE INDEX idx_products_sku_uq ON public.products USING btree (sku);

CREATE UNIQUE INDEX idx_projection_types_description_uq ON public.projection_types USING btree (description);

CREATE UNIQUE INDEX idx_resources_code_uq ON public.resources USING btree (code);

CREATE UNIQUE INDEX idx_role_inheritances_uq ON public.role_inheritances USING btree (parent_role, child_role);

CREATE UNIQUE INDEX idx_role_permissions_uq ON public.role_permissions USING btree (role, permission);

CREATE UNIQUE INDEX idx_roles_code_uq ON public.roles USING btree (code);

CREATE UNIQUE INDEX idx_roles_name_uq ON public.roles USING btree (name);

CREATE UNIQUE INDEX idx_room_projection_types_uq ON public.room_projection_types USING btree (room, projection_type);

CREATE UNIQUE INDEX idx_rooms_cinema_name_uq ON public.rooms USING btree (cinema, name);

CREATE UNIQUE INDEX idx_seat_categories_description_uq ON public.seat_categories USING btree (description);

CREATE UNIQUE INDEX idx_seat_conditions_description_uq ON public.seat_conditions USING btree (description);

CREATE UNIQUE INDEX idx_seats_room_row_col_uq ON public.seats USING btree (room, row_identifier, column_number);

CREATE UNIQUE INDEX idx_showtimes_room_time_uq ON public.showtimes USING btree (room, start_time);

CREATE UNIQUE INDEX idx_statuses_description_uq ON public.statuses USING btree (description);

CREATE UNIQUE INDEX idx_tickets_qr_code_uq ON public.tickets USING btree (qr_code);

CREATE UNIQUE INDEX idx_tickets_showtime_seat_uq ON public.tickets USING btree (showtime, seat);

CREATE UNIQUE INDEX idx_user_permissions_uq ON public.user_permissions USING btree ("user", permission);

CREATE UNIQUE INDEX idx_user_types_description_uq ON public.user_types USING btree (description);

CREATE UNIQUE INDEX idx_users_email_uq ON public.users USING btree (email);

CREATE UNIQUE INDEX idx_users_logins_jti_uq ON public.users_logins USING btree (jti);

CREATE UNIQUE INDEX idx_week_days_day_number_uq ON public.week_days USING btree (day_number);

ALTER TABLE public.actions
    ADD CONSTRAINT fk_actions_status FOREIGN KEY (status) REFERENCES public.statuses(id);

ALTER TABLE public.age_classifications
    ADD CONSTRAINT fk_age_classifications_status FOREIGN KEY (status) REFERENCES public.statuses(id);

ALTER TABLE public.audience_categories
    ADD CONSTRAINT fk_audience_categories_status FOREIGN KEY (status) REFERENCES public.statuses(id);

ALTER TABLE public.cinemas
    ADD CONSTRAINT fk_cinemas_status FOREIGN KEY (status) REFERENCES public.statuses(id);

ALTER TABLE public.combo_products
    ADD CONSTRAINT fk_combo_products_combo FOREIGN KEY (combo) REFERENCES public.combos(id);

ALTER TABLE public.combo_products
    ADD CONSTRAINT fk_combo_products_product FOREIGN KEY (product) REFERENCES public.products(id);

ALTER TABLE public.combo_products
    ADD CONSTRAINT fk_combo_products_status FOREIGN KEY (status) REFERENCES public.statuses(id);

ALTER TABLE public.combos
    ADD CONSTRAINT fk_combos_currency FOREIGN KEY (currency) REFERENCES public.currencies(id);

ALTER TABLE public.combos
    ADD CONSTRAINT fk_combos_status FOREIGN KEY (status) REFERENCES public.statuses(id);

ALTER TABLE public.currencies
    ADD CONSTRAINT fk_currencies_status FOREIGN KEY (status) REFERENCES public.statuses(id);

ALTER TABLE public.customers
    ADD CONSTRAINT fk_customers_loyalty_level FOREIGN KEY (loyalty_level) REFERENCES public.loyalty_levels(id);

ALTER TABLE public.customers
    ADD CONSTRAINT fk_customers_people FOREIGN KEY (person) REFERENCES public.people(id);

ALTER TABLE public.customers
    ADD CONSTRAINT fk_customers_status FOREIGN KEY (status) REFERENCES public.statuses(id);

ALTER TABLE public.employee_positions
    ADD CONSTRAINT fk_employee_positions_cinema FOREIGN KEY (cinema) REFERENCES public.cinemas(id);

ALTER TABLE public.employee_positions
    ADD CONSTRAINT fk_employee_positions_employee FOREIGN KEY (employee) REFERENCES public.employees(id);

ALTER TABLE public.employee_positions
    ADD CONSTRAINT fk_employee_positions_job_position FOREIGN KEY (job_position) REFERENCES public.job_positions(id);

ALTER TABLE public.employee_positions
    ADD CONSTRAINT fk_employee_positions_status FOREIGN KEY (status) REFERENCES public.statuses(id);

ALTER TABLE public.employees
    ADD CONSTRAINT fk_employees_people FOREIGN KEY (person) REFERENCES public.people(id);

ALTER TABLE public.employees
    ADD CONSTRAINT fk_employees_status FOREIGN KEY (status) REFERENCES public.statuses(id);

ALTER TABLE public.exchange_rates
    ADD CONSTRAINT fk_exchange_rates_currency FOREIGN KEY (currency) REFERENCES public.currencies(id);

ALTER TABLE public.exchange_rates
    ADD CONSTRAINT fk_exchange_rates_status FOREIGN KEY (status) REFERENCES public.statuses(id);

ALTER TABLE public.exchange_rates
    ADD CONSTRAINT fk_exchange_rates_user FOREIGN KEY ("user") REFERENCES public.users(id);

ALTER TABLE public.genres
    ADD CONSTRAINT fk_genres_status FOREIGN KEY (status) REFERENCES public.statuses(id);

ALTER TABLE public.inventories
    ADD CONSTRAINT fk_inventories_cinema FOREIGN KEY (cinema) REFERENCES public.cinemas(id);

ALTER TABLE public.inventories
    ADD CONSTRAINT fk_inventories_product FOREIGN KEY (product) REFERENCES public.products(id);

ALTER TABLE public.inventories
    ADD CONSTRAINT fk_inventories_status FOREIGN KEY (status) REFERENCES public.statuses(id);

ALTER TABLE public.inventory_movements
    ADD CONSTRAINT fk_inventory_movements_inventory FOREIGN KEY (inventory) REFERENCES public.inventories(id);

ALTER TABLE public.inventory_movements
    ADD CONSTRAINT fk_inventory_movements_operation_type FOREIGN KEY (operation_type) REFERENCES public.operation_types(id);

ALTER TABLE public.inventory_movements
    ADD CONSTRAINT fk_inventory_movements_status FOREIGN KEY (status) REFERENCES public.statuses(id);

ALTER TABLE public.inventory_movements
    ADD CONSTRAINT fk_inventory_movements_user FOREIGN KEY ("user") REFERENCES public.users(id);

ALTER TABLE public.job_positions
    ADD CONSTRAINT fk_job_positions_status FOREIGN KEY (status) REFERENCES public.statuses(id);

ALTER TABLE public.line_types
    ADD CONSTRAINT fk_line_types_status FOREIGN KEY (status) REFERENCES public.statuses(id);

ALTER TABLE public.loyalty_ledgers
    ADD CONSTRAINT fk_loyalty_ledgers_customer FOREIGN KEY (customer) REFERENCES public.customers(id);

ALTER TABLE public.loyalty_ledgers
    ADD CONSTRAINT fk_loyalty_ledgers_operation_type FOREIGN KEY (operation_type) REFERENCES public.operation_types(id);

ALTER TABLE public.loyalty_ledgers
    ADD CONSTRAINT fk_loyalty_ledgers_order FOREIGN KEY ("order") REFERENCES public.orders(id);

ALTER TABLE public.loyalty_ledgers
    ADD CONSTRAINT fk_loyalty_ledgers_status FOREIGN KEY (status) REFERENCES public.statuses(id);

ALTER TABLE public.loyalty_levels
    ADD CONSTRAINT fk_loyalty_levels_status FOREIGN KEY (status) REFERENCES public.statuses(id);

ALTER TABLE public.modifier_scopes
    ADD CONSTRAINT fk_modifier_scopes_status FOREIGN KEY (status) REFERENCES public.statuses(id);

ALTER TABLE public.movie_genres
    ADD CONSTRAINT fk_movie_genres_genre FOREIGN KEY (genre) REFERENCES public.genres(id);

ALTER TABLE public.movie_genres
    ADD CONSTRAINT fk_movie_genres_movie FOREIGN KEY (movie) REFERENCES public.movies(id);

ALTER TABLE public.movie_genres
    ADD CONSTRAINT fk_movie_genres_status FOREIGN KEY (status) REFERENCES public.statuses(id);

ALTER TABLE public.movie_lifecycle_states
    ADD CONSTRAINT fk_movie_lifecycle_states_status FOREIGN KEY (status) REFERENCES public.statuses(id);

ALTER TABLE public.movie_subscriptions
    ADD CONSTRAINT fk_movie_subscriptions_customer FOREIGN KEY (customer) REFERENCES public.customers(id);

ALTER TABLE public.movie_subscriptions
    ADD CONSTRAINT fk_movie_subscriptions_movie FOREIGN KEY (movie) REFERENCES public.movies(id);

ALTER TABLE public.movie_subscriptions
    ADD CONSTRAINT fk_movie_subscriptions_status FOREIGN KEY (status) REFERENCES public.statuses(id);

ALTER TABLE public.movies
    ADD CONSTRAINT fk_movies_age_classification FOREIGN KEY (age_classification) REFERENCES public.age_classifications(id);

ALTER TABLE public.movies
    ADD CONSTRAINT fk_movies_lifecycle_state FOREIGN KEY (lifecycle_state) REFERENCES public.movie_lifecycle_states(id);

ALTER TABLE public.movies
    ADD CONSTRAINT fk_movies_status FOREIGN KEY (status) REFERENCES public.statuses(id);

ALTER TABLE public.operation_types
    ADD CONSTRAINT fk_operation_types_status FOREIGN KEY (status) REFERENCES public.statuses(id);

ALTER TABLE public.order_lines
    ADD CONSTRAINT fk_order_lines_applied_exchange_rate FOREIGN KEY (applied_exchange_rate) REFERENCES public.exchange_rates(id);

ALTER TABLE public.order_lines
    ADD CONSTRAINT fk_order_lines_combo FOREIGN KEY (combo) REFERENCES public.combos(id);

ALTER TABLE public.order_lines
    ADD CONSTRAINT fk_order_lines_line_type FOREIGN KEY (line_type) REFERENCES public.line_types(id);

ALTER TABLE public.order_lines
    ADD CONSTRAINT fk_order_lines_order FOREIGN KEY ("order") REFERENCES public.orders(id);

ALTER TABLE public.order_lines
    ADD CONSTRAINT fk_order_lines_price_modifier FOREIGN KEY (price_modifier) REFERENCES public.price_modifiers(id);

ALTER TABLE public.order_lines
    ADD CONSTRAINT fk_order_lines_product FOREIGN KEY (product) REFERENCES public.products(id);

ALTER TABLE public.order_lines
    ADD CONSTRAINT fk_order_lines_status FOREIGN KEY (status) REFERENCES public.statuses(id);

ALTER TABLE public.order_payments
    ADD CONSTRAINT fk_order_payments_applied_exchange_rate FOREIGN KEY (applied_exchange_rate) REFERENCES public.exchange_rates(id);

ALTER TABLE public.order_payments
    ADD CONSTRAINT fk_order_payments_order FOREIGN KEY ("order") REFERENCES public.orders(id);

ALTER TABLE public.order_payments
    ADD CONSTRAINT fk_order_payments_payment_method FOREIGN KEY (payment_method) REFERENCES public.payment_methods(id);

ALTER TABLE public.order_payments
    ADD CONSTRAINT fk_order_payments_status FOREIGN KEY (status) REFERENCES public.statuses(id);

ALTER TABLE public.order_statuses
    ADD CONSTRAINT fk_order_statuses_status FOREIGN KEY (status) REFERENCES public.statuses(id);

ALTER TABLE public.orders
    ADD CONSTRAINT fk_orders_base_currency FOREIGN KEY (base_currency) REFERENCES public.currencies(id);

ALTER TABLE public.orders
    ADD CONSTRAINT fk_orders_cinema FOREIGN KEY (cinema) REFERENCES public.cinemas(id);

ALTER TABLE public.orders
    ADD CONSTRAINT fk_orders_customer FOREIGN KEY (customer) REFERENCES public.customers(id);

ALTER TABLE public.orders
    ADD CONSTRAINT fk_orders_employee_position FOREIGN KEY (employee_position) REFERENCES public.employee_positions(id);

ALTER TABLE public.orders
    ADD CONSTRAINT fk_orders_order_status FOREIGN KEY (order_status) REFERENCES public.order_statuses(id);

ALTER TABLE public.orders
    ADD CONSTRAINT fk_orders_status FOREIGN KEY (status) REFERENCES public.statuses(id);

ALTER TABLE public.payment_methods
    ADD CONSTRAINT fk_payment_methods_status FOREIGN KEY (status) REFERENCES public.statuses(id);

ALTER TABLE public.people
    ADD CONSTRAINT fk_people_gender FOREIGN KEY (gender) REFERENCES public.genders(id);

ALTER TABLE public.people
    ADD CONSTRAINT fk_people_status FOREIGN KEY (status) REFERENCES public.statuses(id);

ALTER TABLE public.permission_types
    ADD CONSTRAINT fk_permission_types_status FOREIGN KEY (status) REFERENCES public.statuses(id);

ALTER TABLE public.permissions
    ADD CONSTRAINT fk_permissions_action FOREIGN KEY (action) REFERENCES public.actions(id);

ALTER TABLE public.permissions
    ADD CONSTRAINT fk_permissions_permission_type FOREIGN KEY (permission_type) REFERENCES public.permission_types(id);

ALTER TABLE public.permissions
    ADD CONSTRAINT fk_permissions_resource FOREIGN KEY (resource) REFERENCES public.resources(id);

ALTER TABLE public.permissions
    ADD CONSTRAINT fk_permissions_status FOREIGN KEY (status) REFERENCES public.statuses(id);

ALTER TABLE public.price_modifiers
    ADD CONSTRAINT fk_price_modifiers_audience_category FOREIGN KEY (audience_category) REFERENCES public.audience_categories(id);

ALTER TABLE public.price_modifiers
    ADD CONSTRAINT fk_price_modifiers_combo FOREIGN KEY (combo) REFERENCES public.combos(id);

ALTER TABLE public.price_modifiers
    ADD CONSTRAINT fk_price_modifiers_modifier_scope FOREIGN KEY (modifier_scope) REFERENCES public.modifier_scopes(id);

ALTER TABLE public.price_modifiers
    ADD CONSTRAINT fk_price_modifiers_operation_type FOREIGN KEY (operation_type) REFERENCES public.operation_types(id);

ALTER TABLE public.price_modifiers
    ADD CONSTRAINT fk_price_modifiers_product FOREIGN KEY (product) REFERENCES public.products(id);

ALTER TABLE public.price_modifiers
    ADD CONSTRAINT fk_price_modifiers_product_category FOREIGN KEY (product_category) REFERENCES public.product_categories(id);

ALTER TABLE public.price_modifiers
    ADD CONSTRAINT fk_price_modifiers_projection_type FOREIGN KEY (projection_type) REFERENCES public.projection_types(id);

ALTER TABLE public.price_modifiers
    ADD CONSTRAINT fk_price_modifiers_seat_category FOREIGN KEY (seat_category) REFERENCES public.seat_categories(id);

ALTER TABLE public.price_modifiers
    ADD CONSTRAINT fk_price_modifiers_status FOREIGN KEY (status) REFERENCES public.statuses(id);

ALTER TABLE public.price_modifiers
    ADD CONSTRAINT fk_price_modifiers_week_day FOREIGN KEY (week_day) REFERENCES public.week_days(id);

ALTER TABLE public.product_categories
    ADD CONSTRAINT fk_product_categories_status FOREIGN KEY (status) REFERENCES public.statuses(id);

ALTER TABLE public.products
    ADD CONSTRAINT fk_products_currency FOREIGN KEY (currency) REFERENCES public.currencies(id);

ALTER TABLE public.products
    ADD CONSTRAINT fk_products_product_category FOREIGN KEY (product_category) REFERENCES public.product_categories(id);

ALTER TABLE public.products
    ADD CONSTRAINT fk_products_status FOREIGN KEY (status) REFERENCES public.statuses(id);

ALTER TABLE public.projection_types
    ADD CONSTRAINT fk_projection_types_status FOREIGN KEY (status) REFERENCES public.statuses(id);

ALTER TABLE public.resources
    ADD CONSTRAINT fk_resources_status FOREIGN KEY (status) REFERENCES public.statuses(id);

ALTER TABLE public.role_inheritances
    ADD CONSTRAINT fk_role_inheritances_child_role FOREIGN KEY (child_role) REFERENCES public.roles(id);

ALTER TABLE public.role_inheritances
    ADD CONSTRAINT fk_role_inheritances_parent_role FOREIGN KEY (parent_role) REFERENCES public.roles(id);

ALTER TABLE public.role_inheritances
    ADD CONSTRAINT fk_role_inheritances_status FOREIGN KEY (status) REFERENCES public.statuses(id);

ALTER TABLE public.role_permissions
    ADD CONSTRAINT fk_role_permissions_permission FOREIGN KEY (permission) REFERENCES public.permissions(id);

ALTER TABLE public.role_permissions
    ADD CONSTRAINT fk_role_permissions_role FOREIGN KEY (role) REFERENCES public.roles(id);

ALTER TABLE public.role_permissions
    ADD CONSTRAINT fk_role_permissions_status FOREIGN KEY (status) REFERENCES public.statuses(id);

ALTER TABLE public.roles
    ADD CONSTRAINT fk_roles_status FOREIGN KEY (status) REFERENCES public.statuses(id);

ALTER TABLE public.room_projection_types
    ADD CONSTRAINT fk_room_projection_types_projection_type FOREIGN KEY (projection_type) REFERENCES public.projection_types(id);

ALTER TABLE public.room_projection_types
    ADD CONSTRAINT fk_room_projection_types_room FOREIGN KEY (room) REFERENCES public.rooms(id);

ALTER TABLE public.room_projection_types
    ADD CONSTRAINT fk_room_projection_types_status FOREIGN KEY (status) REFERENCES public.statuses(id);

ALTER TABLE public.rooms
    ADD CONSTRAINT fk_rooms_cinema FOREIGN KEY (cinema) REFERENCES public.cinemas(id);

ALTER TABLE public.rooms
    ADD CONSTRAINT fk_rooms_status FOREIGN KEY (status) REFERENCES public.statuses(id);

ALTER TABLE public.seat_categories
    ADD CONSTRAINT fk_seat_categories_status FOREIGN KEY (status) REFERENCES public.statuses(id);

ALTER TABLE public.seat_conditions
    ADD CONSTRAINT fk_seat_conditions_status FOREIGN KEY (status) REFERENCES public.statuses(id);

ALTER TABLE public.seats
    ADD CONSTRAINT fk_seats_room FOREIGN KEY (room) REFERENCES public.rooms(id);

ALTER TABLE public.seats
    ADD CONSTRAINT fk_seats_seat_category FOREIGN KEY (seat_category) REFERENCES public.seat_categories(id);

ALTER TABLE public.seats
    ADD CONSTRAINT fk_seats_seat_condition FOREIGN KEY (seat_condition) REFERENCES public.seat_conditions(id);

ALTER TABLE public.seats
    ADD CONSTRAINT fk_seats_status FOREIGN KEY (status) REFERENCES public.statuses(id);

ALTER TABLE public.showtimes
    ADD CONSTRAINT fk_showtimes_currency FOREIGN KEY (currency) REFERENCES public.currencies(id);

ALTER TABLE public.showtimes
    ADD CONSTRAINT fk_showtimes_movie FOREIGN KEY (movie) REFERENCES public.movies(id);

ALTER TABLE public.showtimes
    ADD CONSTRAINT fk_showtimes_projection_type FOREIGN KEY (projection_type) REFERENCES public.projection_types(id);

ALTER TABLE public.showtimes
    ADD CONSTRAINT fk_showtimes_room FOREIGN KEY (room) REFERENCES public.rooms(id);

ALTER TABLE public.showtimes
    ADD CONSTRAINT fk_showtimes_status FOREIGN KEY (status) REFERENCES public.statuses(id);

ALTER TABLE public.tickets
    ADD CONSTRAINT fk_tickets_applied_exchange_rate FOREIGN KEY (applied_exchange_rate) REFERENCES public.exchange_rates(id);

ALTER TABLE public.tickets
    ADD CONSTRAINT fk_tickets_order FOREIGN KEY ("order") REFERENCES public.orders(id);

ALTER TABLE public.tickets
    ADD CONSTRAINT fk_tickets_price_modifier FOREIGN KEY (price_modifier) REFERENCES public.price_modifiers(id);

ALTER TABLE public.tickets
    ADD CONSTRAINT fk_tickets_seat FOREIGN KEY (seat) REFERENCES public.seats(id);

ALTER TABLE public.tickets
    ADD CONSTRAINT fk_tickets_showtime FOREIGN KEY (showtime) REFERENCES public.showtimes(id);

ALTER TABLE public.tickets
    ADD CONSTRAINT fk_tickets_status FOREIGN KEY (status) REFERENCES public.statuses(id);

ALTER TABLE public.user_permissions
    ADD CONSTRAINT fk_user_permissions_permission FOREIGN KEY (permission) REFERENCES public.permissions(id);

ALTER TABLE public.user_permissions
    ADD CONSTRAINT fk_user_permissions_status FOREIGN KEY (status) REFERENCES public.statuses(id);

ALTER TABLE public.user_permissions
    ADD CONSTRAINT fk_user_permissions_user FOREIGN KEY ("user") REFERENCES public.users(id);

ALTER TABLE public.user_types
    ADD CONSTRAINT fk_user_types_status FOREIGN KEY (status) REFERENCES public.statuses(id);

ALTER TABLE public.users
    ADD CONSTRAINT fk_users_people FOREIGN KEY (person) REFERENCES public.people(id);

ALTER TABLE public.users
    ADD CONSTRAINT fk_users_role FOREIGN KEY (role) REFERENCES public.roles(id);

ALTER TABLE public.users
    ADD CONSTRAINT fk_users_status FOREIGN KEY (status) REFERENCES public.statuses(id);

ALTER TABLE public.users
    ADD CONSTRAINT fk_users_user_type FOREIGN KEY (user_type) REFERENCES public.user_types(id);

ALTER TABLE public.week_days
    ADD CONSTRAINT fk_week_days_status FOREIGN KEY (status) REFERENCES public.statuses(id);
