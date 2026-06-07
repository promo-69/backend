CREATE TABLE public.actions (
    id integer NOT NULL PRIMARY KEY,
    code character varying(100) NOT NULL,
    description character varying(255) NOT NULL,
    deleted_at timestamp with time zone
);
CREATE TABLE public.age_classifications (
    id integer NOT NULL PRIMARY KEY,
    description character varying(255) NOT NULL,
    deleted_at timestamp with time zone
);
CREATE TABLE public.applied_price_modifiers (
    id integer NOT NULL PRIMARY KEY,
    price_modifier integer NOT NULL,
    "order" integer,
    ticket integer,
    order_line integer,
    rental_request integer,
    rental_catering integer,
    applied_amount_base_currency numeric(10,2) NOT NULL,
    deleted_at timestamp with time zone,
    CONSTRAINT chk_applied_modifiers_target CHECK ((num_nonnulls("order", ticket, order_line, rental_request, rental_catering) = 1))
);
CREATE TABLE public.audience_categories (
    id integer NOT NULL PRIMARY KEY,
    description character varying(255) NOT NULL,
    deleted_at timestamp with time zone
);
CREATE TABLE public.booking_types (
    id integer NOT NULL PRIMARY KEY,
    description character varying(255) NOT NULL,
    deleted_at timestamp with time zone
);
CREATE TABLE public.catalog_audit_logs (
    id bigint NOT NULL,
    table_name character varying(100) NOT NULL,
    record_id integer NOT NULL PRIMARY KEY,
    action character varying(10) NOT NULL,
    changed_by integer,
    previous_data jsonb,
    new_data jsonb,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);
CREATE TABLE public.cinemas (
    id integer NOT NULL PRIMARY KEY,
    name character varying(255) NOT NULL,
    address text,
    phone character varying(50),
    opening_time time without time zone NOT NULL,
    closing_time time without time zone NOT NULL,
    deleted_at timestamp with time zone,
    CONSTRAINT chk_cinemas_times CHECK ((closing_time > opening_time))
);
CREATE TABLE public.combo_products (
    id integer NOT NULL PRIMARY KEY,
    combo integer NOT NULL,
    product integer NOT NULL,
    quantity integer NOT NULL,
    deleted_at timestamp with time zone,
    CONSTRAINT chk_combo_products_qty CHECK ((quantity > 0))
);
CREATE TABLE public.combos (
    id integer NOT NULL PRIMARY KEY,
    cinema integer NOT NULL,
    name character varying(255) NOT NULL,
    sku character varying(100) NOT NULL,
    description character varying(255) NOT NULL,
    image_url character varying(500),
    currency integer NOT NULL,
    price numeric(10,2) NOT NULL,
    earned_loyalty_points integer,
    deleted_at timestamp with time zone
);
CREATE TABLE public.currencies (
    id integer NOT NULL PRIMARY KEY,
    code character varying(10) NOT NULL,
    description character varying(255) NOT NULL,
    symbol character varying(10) NOT NULL,
    is_base_currency boolean NOT NULL,
    deleted_at timestamp with time zone
);
CREATE TABLE public.customers (
    id integer NOT NULL PRIMARY KEY,
    person integer NOT NULL,
    loyalty_level integer DEFAULT 1 NOT NULL,
    level_progress_points integer DEFAULT 0 NOT NULL,
    registration_date timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at timestamp with time zone,
    CONSTRAINT chk_customers_progress CHECK ((level_progress_points >= 0))
);
CREATE TABLE public.employee_positions (
    id integer NOT NULL PRIMARY KEY,
    employee integer NOT NULL,
    job_position integer NOT NULL,
    cinema integer NOT NULL,
    start_date date NOT NULL,
    end_date date,
    salary_base numeric(10,2),
    deleted_at timestamp with time zone,
    CONSTRAINT chk_employee_positions_dates CHECK (((end_date IS NULL) OR (end_date >= start_date)))
);
CREATE TABLE public.employees (
    id integer NOT NULL PRIMARY KEY,
    person integer NOT NULL,
    employee_code character varying(50) NOT NULL,
    deleted_at timestamp with time zone
);
CREATE TABLE public.exchange_rates (
    id integer NOT NULL PRIMARY KEY,
    currency integer NOT NULL,
    rate numeric(10,2) NOT NULL,
    "user" integer NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at timestamp with time zone,
    CONSTRAINT chk_exchange_rates_rate CHECK ((rate > (0)::numeric))
);
CREATE TABLE public.genders (
    id integer NOT NULL PRIMARY KEY,
    description character varying(255) NOT NULL,
    deleted_at timestamp with time zone
);
CREATE TABLE public.genres (
    id integer NOT NULL PRIMARY KEY,
    description character varying(255) NOT NULL,
    deleted_at timestamp with time zone
);
CREATE TABLE public.inventories (
    id integer NOT NULL PRIMARY KEY,
    cinema integer NOT NULL,
    product integer NOT NULL,
    minimum_stock integer DEFAULT 0 NOT NULL,
    deleted_at timestamp with time zone,
    stock integer DEFAULT 0 NOT NULL,
    CONSTRAINT chk_inventories_min_stock CHECK ((minimum_stock >= 0)),
    CONSTRAINT chk_inventories_stock CHECK ((stock >= 0))
);
CREATE TABLE public.inventory_movements (
    id integer NOT NULL PRIMARY KEY,
    inventory integer NOT NULL,
    operation_type integer NOT NULL,
    quantity integer NOT NULL,
    unit_cost numeric(10,2) DEFAULT 0 NOT NULL,
    currency integer DEFAULT 1 NOT NULL,
    "user" integer NOT NULL,
    resulting_stock integer NOT NULL,
    resulting_unit_cost_base_currency numeric(10,2) NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    remarks character varying(255),
    deleted_at timestamp with time zone,
    CONSTRAINT chk_inventory_movements_cost CHECK ((unit_cost >= (0)::numeric)),
    CONSTRAINT chk_inventory_movements_qty CHECK ((quantity > 0))
);
CREATE TABLE public.invoice_sequences (
    id integer NOT NULL PRIMARY KEY,
    cinema integer NOT NULL,
    prefix character varying(10) NOT NULL,
    current_value integer DEFAULT 0 NOT NULL,
    deleted_at timestamp with time zone
);
CREATE TABLE public.invoices (
    id integer NOT NULL PRIMARY KEY,
    "order" integer NOT NULL,
    invoice_number character varying(100) NOT NULL,
    billing_document character varying(100) NOT NULL,
    billing_name character varying(255) NOT NULL,
    billing_address text,
    issued_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at timestamp with time zone
);
CREATE TABLE public.job_positions (
    id integer NOT NULL PRIMARY KEY,
    title character varying(255) NOT NULL,
    description character varying(255),
    is_pensionable boolean DEFAULT false NOT NULL,
    deleted_at timestamp with time zone
);
CREATE TABLE public.languages (
    id integer NOT NULL PRIMARY KEY,
    description character varying(255) NOT NULL,
    deleted_at timestamp with time zone
);
CREATE TABLE public.line_types (
    id integer NOT NULL PRIMARY KEY,
    description character varying(255) NOT NULL,
    deleted_at timestamp with time zone
);
CREATE TABLE public.loyalty_ledgers (
    id integer NOT NULL PRIMARY KEY,
    customer integer NOT NULL,
    "order" integer,
    operation_type integer NOT NULL,
    points integer NOT NULL,
    points_balance integer DEFAULT 0 NOT NULL,
    remarks text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at timestamp with time zone,
    CONSTRAINT chk_loyalty_ledgers_pts CHECK ((points > 0))
);
CREATE TABLE public.loyalty_levels (
    id integer NOT NULL PRIMARY KEY,
    name character varying(100) NOT NULL,
    required_points integer,
    deleted_at timestamp with time zone,
    CONSTRAINT chk_loyalty_levels_pts CHECK ((required_points >= 0))
);
CREATE TABLE public.modifier_scopes (
    id integer NOT NULL PRIMARY KEY,
    description character varying(255) NOT NULL,
    deleted_at timestamp with time zone
);
CREATE TABLE public.movie_genres (
    id integer NOT NULL PRIMARY KEY,
    movie integer NOT NULL,
    genre integer NOT NULL,
    deleted_at timestamp with time zone
);
CREATE TABLE public.movie_languages (
    id integer NOT NULL PRIMARY KEY,
    movie integer NOT NULL,
    language integer NOT NULL,
    deleted_at timestamp with time zone
);
CREATE TABLE public.movie_lifecycle_states (
    id integer NOT NULL PRIMARY KEY,
    description character varying(255) NOT NULL,
    deleted_at timestamp with time zone
);
CREATE TABLE public.movie_projection_types (
    id integer NOT NULL PRIMARY KEY,
    movie integer NOT NULL,
    projection_type integer NOT NULL,
    deleted_at timestamp with time zone
);
CREATE TABLE public.movie_user_subscriptions (
    id integer NOT NULL PRIMARY KEY,
    customer integer NOT NULL,
    movie integer NOT NULL,
    is_notified boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at timestamp with time zone
);
CREATE TABLE public.movies (
    id integer NOT NULL PRIMARY KEY,
    title character varying(255) NOT NULL,
    duration_minutes integer NOT NULL,
    age_classification integer NOT NULL,
    lifecycle_state integer NOT NULL,
    synopsis text NOT NULL,
    trailer_url character varying(255),
    poster_url character varying(255),
    banner_url character varying(255),
    release_date date NOT NULL,
    deleted_at timestamp with time zone,
    CONSTRAINT chk_movies_duration CHECK ((duration_minutes > 0))
);
CREATE TABLE public.operation_types (
    id integer NOT NULL PRIMARY KEY,
    description character varying(255) NOT NULL,
    is_increment boolean NOT NULL,
    deleted_at timestamp with time zone
);
CREATE TABLE public.order_lines (
    id integer NOT NULL PRIMARY KEY,
    "order" integer NOT NULL,
    line_type integer NOT NULL,
    product integer,
    combo integer,
    quantity integer NOT NULL,
    original_unit_price numeric(10,2) NOT NULL,
    unit_price numeric(10,2) NOT NULL,
    quoted_exchange_rate integer NOT NULL,
    deleted_at timestamp with time zone,
    CONSTRAINT chk_order_lines_logic CHECK (((quantity > 0) AND (original_unit_price >= (0)::numeric) AND (unit_price >= (0)::numeric) AND (((line_type = 1) AND (product IS NOT NULL) AND (combo IS NULL)) OR ((line_type = 2) AND (product IS NULL) AND (combo IS NOT NULL)))))
);
CREATE TABLE public.order_payments (
    id integer NOT NULL PRIMARY KEY,
    "order" integer NOT NULL,
    payment_method integer NOT NULL,
    amount numeric(10,2) NOT NULL,
    quoted_exchange_rate integer NOT NULL,
    reference_number character varying(255),
    is_approved boolean NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at timestamp with time zone,
    CONSTRAINT chk_order_payments_amt CHECK ((amount > (0)::numeric))
);
CREATE TABLE public.order_statuses (
    id integer NOT NULL PRIMARY KEY,
    description character varying(255) NOT NULL,
    deleted_at timestamp with time zone
);
CREATE TABLE public.order_taxes (
    id integer NOT NULL PRIMARY KEY,
    "order" integer NOT NULL,
    tax integer NOT NULL,
    applied_rate numeric(10,2) NOT NULL,
    tax_amount_base_currency numeric(10,2) NOT NULL,
    deleted_at timestamp with time zone,
    CONSTRAINT chk_order_taxes_amounts CHECK (((applied_rate >= (0)::numeric) AND (tax_amount_base_currency >= (0)::numeric)))
);
CREATE TABLE public.orders (
    id integer NOT NULL PRIMARY KEY,
    customer integer NOT NULL,
    employee integer,
    cinema integer NOT NULL,
    system_base_currency integer NOT NULL,
    subtotal_base_currency numeric(10,2) NOT NULL,
    tax_amount_base_currency numeric(10,2) NOT NULL,
    total_amount_base_currency numeric(10,2) NOT NULL,
    generated_points integer NOT NULL,
    order_status integer DEFAULT 1 NOT NULL,
    remarks text,
    qr_code character varying(500),
    tickets_validated_at timestamp with time zone,
    concessions_validated_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at timestamp with time zone,
    CONSTRAINT chk_orders_amounts CHECK (((subtotal_base_currency >= (0)::numeric) AND (tax_amount_base_currency >= (0)::numeric) AND (total_amount_base_currency >= (0)::numeric) AND (generated_points >= 0)))
);
CREATE TABLE public.payment_methods (
    id integer NOT NULL PRIMARY KEY,
    description character varying(255) NOT NULL,
    requires_reference boolean NOT NULL,
    deleted_at timestamp with time zone
);
CREATE TABLE public.people (
    id integer NOT NULL PRIMARY KEY,
    document_number character varying(50) NOT NULL,
    first_name character varying(255) NOT NULL,
    last_name character varying(255) NOT NULL,
    gender integer,
    phone_number character varying(50),
    personal_email character varying(100),
    birth_date date,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone,
    deleted_at timestamp with time zone
);
CREATE TABLE public.permission_types (
    id integer NOT NULL PRIMARY KEY,
    code character varying(100) NOT NULL,
    description character varying(255) NOT NULL,
    deleted_at timestamp with time zone
);
CREATE TABLE public.permissions (
    id integer NOT NULL PRIMARY KEY,
    action integer NOT NULL,
    resource integer NOT NULL,
    permission_type integer NOT NULL,
    deleted_at timestamp with time zone
);
CREATE TABLE public.price_modifiers (
    id integer NOT NULL PRIMARY KEY,
    description character varying(255) NOT NULL,
    operation_type integer NOT NULL,
    is_percentage boolean NOT NULL,
    value numeric(10,2) NOT NULL,
    currency integer,
    modifier_scope integer NOT NULL,
    audience_category integer,
    week_day integer,
    seat_category integer,
    projection_type integer,
    product_category integer,
    product integer,
    combo integer,
    cinema integer,
    start_date date,
    end_date date,
    start_time time without time zone,
    end_time time without time zone,
    line_type integer,
    booking_type integer,
    movie integer,
    room_type integer,
    target_currency integer,
    target_currency_condition boolean DEFAULT false,
    deleted_at timestamp with time zone,
    CONSTRAINT chk_price_modifiers_dates CHECK (((start_date IS NULL) OR (end_date IS NULL) OR (end_date >= start_date))),
    CONSTRAINT chk_price_modifiers_logic CHECK (((value > (0)::numeric) AND (((modifier_scope = 1) AND (product_category IS NULL) AND (product IS NULL) AND (combo IS NULL) AND (line_type IS NULL)) OR ((modifier_scope = 2) AND (audience_category IS NULL) AND (seat_category IS NULL) AND (projection_type IS NULL)) OR ((modifier_scope = 3) AND (product_category IS NULL) AND (product IS NULL) AND (combo IS NULL) AND (audience_category IS NULL) AND (seat_category IS NULL) AND (projection_type IS NULL) AND (line_type IS NULL))))),
    CONSTRAINT chk_price_modifiers_times CHECK (((start_time IS NULL) OR (end_time IS NULL) OR (end_time > start_time)))
);
CREATE TABLE public.product_categories (
    id integer NOT NULL PRIMARY KEY,
    description character varying(255) NOT NULL,
    deleted_at timestamp with time zone
);
CREATE TABLE public.products (
    id integer NOT NULL PRIMARY KEY,
    name character varying(255) NOT NULL,
    sku character varying(100) NOT NULL,
    image_url character varying(500),
    product_category integer NOT NULL,
    currency integer NOT NULL,
    price numeric(10,2) NOT NULL,
    earned_loyalty_points integer,
    deleted_at timestamp with time zone
);
CREATE TABLE public.projection_types (
    id integer NOT NULL PRIMARY KEY,
    description character varying(255) NOT NULL,
    deleted_at timestamp with time zone
);
CREATE TABLE public.rental_catering (
    id integer NOT NULL PRIMARY KEY,
    rental_request integer NOT NULL,
    line_type integer NOT NULL,
    product integer,
    combo integer,
    quantity integer NOT NULL,
    original_unit_price numeric(10,2),
    unit_price numeric(10,2),
    quoted_exchange_rate integer,
    deleted_at timestamp with time zone,
    CONSTRAINT chk_rental_catering_logic CHECK (((quantity > 0) AND (((line_type = 1) AND (product IS NOT NULL) AND (combo IS NULL)) OR ((line_type = 2) AND (product IS NULL) AND (combo IS NOT NULL)))))
);
CREATE TABLE public.rental_request_statuses (
    id integer NOT NULL PRIMARY KEY,
    description character varying(100) NOT NULL,
    deleted_at timestamp with time zone
);
CREATE TABLE public.rental_requests (
    id integer NOT NULL PRIMARY KEY,
    customer integer NOT NULL,
    "order" integer,
    booking integer,
    room integer NOT NULL,
    event_type integer NOT NULL,
    requested_start_time timestamp with time zone NOT NULL,
    requested_end_time timestamp with time zone NOT NULL,
    event_name character varying(255) NOT NULL,
    event_description text,
    status integer NOT NULL,
    currency integer,
    price numeric(10,2),
    deleted_at timestamp with time zone,
    event_date date NOT NULL,
    attendees integer
);
CREATE TABLE public.resources (
    id integer NOT NULL PRIMARY KEY,
    code character varying(100) NOT NULL,
    description character varying(255) NOT NULL,
    deleted_at timestamp with time zone
);
CREATE TABLE public.role_inheritances (
    id integer NOT NULL PRIMARY KEY,
    parent_role integer NOT NULL,
    child_role integer NOT NULL,
    deleted_at timestamp with time zone,
    CONSTRAINT chk_role_inheritances_diff CHECK ((parent_role <> child_role))
);
CREATE TABLE public.role_permissions (
    id integer NOT NULL PRIMARY KEY,
    role integer NOT NULL,
    permission integer NOT NULL,
    deleted_at timestamp with time zone
);
CREATE TABLE public.roles (
    id integer NOT NULL PRIMARY KEY,
    code character varying(50) NOT NULL,
    name character varying(100) NOT NULL,
    description character varying(255) NOT NULL,
    deleted_at timestamp with time zone
);
CREATE TABLE public.room_bookings (
    id integer NOT NULL PRIMARY KEY,
    room integer NOT NULL,
    start_time timestamp with time zone NOT NULL,
    end_time timestamp with time zone NOT NULL,
    booking_type integer NOT NULL,
    deleted_at timestamp with time zone
);
CREATE TABLE public.room_events (
    id integer NOT NULL PRIMARY KEY,
    booking integer NOT NULL,
    event_type integer NOT NULL,
    name character varying(255) NOT NULL,
    organizer character varying(255),
    description text,
    currency integer NOT NULL,
    price numeric(10,2) NOT NULL,
    deleted_at timestamp with time zone
);
CREATE TABLE public.room_projection_types (
    id integer NOT NULL PRIMARY KEY,
    room integer NOT NULL,
    projection_type integer NOT NULL,
    deleted_at timestamp with time zone
);
CREATE TABLE public.room_types (
    id integer NOT NULL PRIMARY KEY,
    description character varying(255) NOT NULL,
    deleted_at timestamp with time zone
);
CREATE TABLE public.rooms (
    id integer NOT NULL PRIMARY KEY,
    cinema integer NOT NULL,
    room_type integer NOT NULL,
    name character varying(100) NOT NULL,
    grid_rows integer NOT NULL,
    grid_columns integer NOT NULL,
    deleted_at timestamp with time zone,
    CONSTRAINT chk_rooms_capacity CHECK (((grid_rows > 0) AND (grid_columns > 0)))
);
CREATE TABLE public.seat_categories (
    id integer NOT NULL PRIMARY KEY,
    description character varying(255) NOT NULL,
    deleted_at timestamp with time zone
);
CREATE TABLE public.seat_conditions (
    id integer NOT NULL PRIMARY KEY,
    description character varying(255) NOT NULL,
    deleted_at timestamp with time zone
);
CREATE TABLE public.seats (
    id integer NOT NULL PRIMARY KEY,
    room integer NOT NULL,
    row_identifier character varying(2) NOT NULL,
    column_number integer NOT NULL,
    seat_category integer NOT NULL,
    seat_condition integer NOT NULL,
    deleted_at timestamp with time zone,
    CONSTRAINT chk_seats_col CHECK ((column_number > 0))
);
CREATE TABLE public.showtimes (
    id integer NOT NULL PRIMARY KEY,
    booking integer NOT NULL,
    movie integer NOT NULL,
    projection_type integer NOT NULL,
    language integer NOT NULL,
    currency integer NOT NULL,
    price numeric(10,2) NOT NULL,
    earned_loyalty_points integer,
    deleted_at timestamp with time zone
);
CREATE TABLE public.tax_rules (
    id integer NOT NULL PRIMARY KEY,
    tax integer NOT NULL,
    tax_scope integer NOT NULL,
    cinema integer,
    line_type integer,
    product_category integer,
    product integer,
    combo integer,
    deleted_at timestamp with time zone,
    CONSTRAINT chk_tax_rules_logic CHECK ((((tax_scope = 1) AND (product_category IS NULL) AND (product IS NULL) AND (combo IS NULL) AND (line_type IS NULL)) OR (tax_scope = 2) OR ((tax_scope = 3) AND (product_category IS NULL) AND (product IS NULL) AND (combo IS NULL) AND (line_type IS NULL))))
);
CREATE TABLE public.taxes (
    id integer NOT NULL PRIMARY KEY,
    name character varying(100) NOT NULL,
    rate numeric(10,2) NOT NULL,
    is_percentage boolean DEFAULT true NOT NULL,
    deleted_at timestamp with time zone,
    CONSTRAINT chk_taxes_rate CHECK ((rate >= (0)::numeric))
);
CREATE TABLE public.tickets (
    id integer NOT NULL PRIMARY KEY,
    "order" integer NOT NULL,
    booking integer NOT NULL,
    seat integer NOT NULL,
    original_price numeric(10,2) NOT NULL,
    price numeric(10,2) NOT NULL,
    quoted_exchange_rate integer NOT NULL,
    validation_time timestamp with time zone,
    deleted_at timestamp with time zone,
    CONSTRAINT chk_tickets_prices CHECK (((original_price >= (0)::numeric) AND (price >= (0)::numeric)))
);
CREATE TABLE public.user_permissions (
    id integer NOT NULL PRIMARY KEY,
    "user" integer NOT NULL,
    permission integer NOT NULL,
    is_granted boolean NOT NULL,
    deleted_at timestamp with time zone
);
CREATE TABLE public.user_types (
    id integer NOT NULL PRIMARY KEY,
    description character varying(255) NOT NULL,
    deleted_at timestamp with time zone
);
CREATE TABLE public.users (
    id integer NOT NULL PRIMARY KEY,
    person integer NOT NULL,
    user_type integer NOT NULL,
    role integer,
    email character varying(100) NOT NULL,
    password character varying(255) NOT NULL,
    signup_code character varying(60),
    signup_verified_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone,
    deleted_at timestamp with time zone,
    CONSTRAINT chk_users_role CHECK ((((user_type = 1) AND (role IS NOT NULL)) OR ((user_type = 2) AND (role IS NULL))))
);
CREATE TABLE public.users_logins (
    id integer NOT NULL PRIMARY KEY,
    "user" integer NOT NULL,
    device character varying(500),
    jti character varying(255) NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone,
    deleted_at timestamp with time zone
);
CREATE TABLE public.week_days (
    id integer NOT NULL PRIMARY KEY,
    description character varying(50) NOT NULL,
    day_number integer NOT NULL,
    deleted_at timestamp with time zone,
    CONSTRAINT chk_week_days_range CHECK (((day_number >= 1) AND (day_number <= 7)))
);
CREATE UNIQUE INDEX idx_actions_code_uq ON public.actions USING btree (code) WHERE (deleted_at IS NULL);
CREATE UNIQUE INDEX idx_age_classifications_description_uq ON public.age_classifications USING btree (description) WHERE (deleted_at IS NULL);
CREATE UNIQUE INDEX idx_audience_categories_description_uq ON public.audience_categories USING btree (description) WHERE (deleted_at IS NULL);
CREATE INDEX idx_audit_logs_changed_by ON public.catalog_audit_logs USING btree (changed_by);
CREATE INDEX idx_audit_logs_created_at ON public.catalog_audit_logs USING btree (created_at);
CREATE INDEX idx_audit_logs_record_id ON public.catalog_audit_logs USING btree (record_id);
CREATE INDEX idx_audit_logs_table_name ON public.catalog_audit_logs USING btree (table_name);
CREATE INDEX idx_audit_logs_table_record ON public.catalog_audit_logs USING btree (table_name, record_id);
CREATE UNIQUE INDEX idx_booking_types_description_uq ON public.booking_types USING btree (description) WHERE (deleted_at IS NULL);
CREATE UNIQUE INDEX idx_cinemas_name_uq ON public.cinemas USING btree (name) WHERE (deleted_at IS NULL);
CREATE UNIQUE INDEX idx_combo_products_uq ON public.combo_products USING btree (combo, product) WHERE (deleted_at IS NULL);
CREATE UNIQUE INDEX idx_combos_name_uq ON public.combos USING btree (cinema, name) WHERE (deleted_at IS NULL);
CREATE UNIQUE INDEX idx_combos_sku_uq ON public.combos USING btree (sku) WHERE (deleted_at IS NULL);
CREATE UNIQUE INDEX idx_currencies_code_uq ON public.currencies USING btree (code) WHERE (deleted_at IS NULL);
CREATE UNIQUE INDEX idx_customers_people_uq ON public.customers USING btree (person) WHERE (deleted_at IS NULL);
CREATE UNIQUE INDEX idx_employee_positions_active_uq ON public.employee_positions USING btree (employee) WHERE ((deleted_at IS NULL) AND (end_date IS NULL));
CREATE UNIQUE INDEX idx_employees_code_uq ON public.employees USING btree (employee_code) WHERE (deleted_at IS NULL);
CREATE UNIQUE INDEX idx_employees_people_uq ON public.employees USING btree (person) WHERE (deleted_at IS NULL);
CREATE INDEX idx_exchange_rates_currency_date ON public.exchange_rates USING btree (currency, created_at);
CREATE UNIQUE INDEX idx_genders_description_uq ON public.genders USING btree (description) WHERE (deleted_at IS NULL);
CREATE UNIQUE INDEX idx_genres_description_uq ON public.genres USING btree (description) WHERE (deleted_at IS NULL);
CREATE INDEX idx_inv_mov_calc ON public.inventory_movements USING btree (inventory, operation_type);
CREATE UNIQUE INDEX idx_inventories_cinema_product_uq ON public.inventories USING btree (cinema, product) WHERE (deleted_at IS NULL);
CREATE INDEX idx_inventories_stock ON public.inventories USING btree (stock);
CREATE UNIQUE INDEX idx_invoice_sequences_cinema_uq ON public.invoice_sequences USING btree (cinema) WHERE (deleted_at IS NULL);
CREATE UNIQUE INDEX idx_invoice_sequences_prefix_uq ON public.invoice_sequences USING btree (prefix) WHERE (deleted_at IS NULL);
CREATE INDEX idx_invoices_billing_document ON public.invoices USING btree (billing_document);
CREATE INDEX idx_invoices_issued_at ON public.invoices USING btree (issued_at);
CREATE UNIQUE INDEX idx_invoices_number_uq ON public.invoices USING btree (invoice_number) WHERE (deleted_at IS NULL);
CREATE INDEX idx_invoices_order ON public.invoices USING btree ("order");
CREATE UNIQUE INDEX idx_job_positions_title_uq ON public.job_positions USING btree (title) WHERE (deleted_at IS NULL);
CREATE UNIQUE INDEX idx_languages_description_uq ON public.languages USING btree (description) WHERE (deleted_at IS NULL);
CREATE UNIQUE INDEX idx_line_types_description_uq ON public.line_types USING btree (description) WHERE (deleted_at IS NULL);
CREATE INDEX idx_loyalty_customer_op ON public.loyalty_ledgers USING btree (customer, operation_type);
CREATE UNIQUE INDEX idx_loyalty_levels_name_uq ON public.loyalty_levels USING btree (name) WHERE (deleted_at IS NULL);
CREATE UNIQUE INDEX idx_modifier_scopes_description_uq ON public.modifier_scopes USING btree (description) WHERE (deleted_at IS NULL);
CREATE UNIQUE INDEX idx_movie_genres_uq ON public.movie_genres USING btree (movie, genre) WHERE (deleted_at IS NULL);
CREATE UNIQUE INDEX idx_movie_languages_uq ON public.movie_languages USING btree (movie, language) WHERE (deleted_at IS NULL);
CREATE UNIQUE INDEX idx_movie_lifecycle_states_description_uq ON public.movie_lifecycle_states USING btree (description) WHERE (deleted_at IS NULL);
CREATE UNIQUE INDEX idx_movie_projection_types_uq ON public.movie_projection_types USING btree (movie, projection_type) WHERE (deleted_at IS NULL);
CREATE UNIQUE INDEX idx_movie_user_subscriptions_uq ON public.movie_user_subscriptions USING btree (customer, movie) WHERE (deleted_at IS NULL);
CREATE UNIQUE INDEX idx_movies_title_uq ON public.movies USING btree (title) WHERE (deleted_at IS NULL);
CREATE UNIQUE INDEX idx_operation_types_description_uq ON public.operation_types USING btree (description) WHERE (deleted_at IS NULL);
CREATE INDEX idx_order_lines_order ON public.order_lines USING btree ("order");
CREATE INDEX idx_order_payments_order ON public.order_payments USING btree ("order");
CREATE UNIQUE INDEX idx_order_payments_ref_uq ON public.order_payments USING btree (payment_method, reference_number) WHERE (deleted_at IS NULL);
CREATE UNIQUE INDEX idx_order_statuses_description_uq ON public.order_statuses USING btree (description) WHERE (deleted_at IS NULL);
CREATE INDEX idx_order_taxes_order ON public.order_taxes USING btree ("order");
CREATE INDEX idx_orders_cinema_date ON public.orders USING btree (cinema, created_at);
CREATE INDEX idx_orders_customer ON public.orders USING btree (customer);
CREATE UNIQUE INDEX idx_payment_methods_uq ON public.payment_methods USING btree (description) WHERE (deleted_at IS NULL);
CREATE INDEX idx_payments_method_date ON public.order_payments USING btree (payment_method, created_at);
CREATE UNIQUE INDEX idx_people_document_number_uq ON public.people USING btree (document_number) WHERE (deleted_at IS NULL);
CREATE UNIQUE INDEX idx_permission_types_code_uq ON public.permission_types USING btree (code) WHERE (deleted_at IS NULL);
CREATE UNIQUE INDEX idx_permissions_uq ON public.permissions USING btree (action, resource, permission_type) WHERE (deleted_at IS NULL);
CREATE INDEX idx_price_modifiers_cinema ON public.price_modifiers USING btree (cinema);
CREATE INDEX idx_price_modifiers_dates ON public.price_modifiers USING btree (start_date, end_date);
CREATE INDEX idx_price_modifiers_scope ON public.price_modifiers USING btree (modifier_scope);
CREATE UNIQUE INDEX idx_product_categories_description_uq ON public.product_categories USING btree (description) WHERE (deleted_at IS NULL);
CREATE UNIQUE INDEX idx_products_sku_uq ON public.products USING btree (sku) WHERE (deleted_at IS NULL);
CREATE UNIQUE INDEX idx_projection_types_description_uq ON public.projection_types USING btree (description) WHERE (deleted_at IS NULL);
CREATE INDEX idx_rentals_customer_time ON public.rental_requests USING btree (customer, requested_start_time);
CREATE UNIQUE INDEX idx_resources_code_uq ON public.resources USING btree (code) WHERE (deleted_at IS NULL);
CREATE UNIQUE INDEX idx_role_inheritances_uq ON public.role_inheritances USING btree (parent_role, child_role) WHERE (deleted_at IS NULL);
CREATE UNIQUE INDEX idx_role_permissions_uq ON public.role_permissions USING btree (role, permission) WHERE (deleted_at IS NULL);
CREATE UNIQUE INDEX idx_roles_code_uq ON public.roles USING btree (code) WHERE (deleted_at IS NULL);
CREATE UNIQUE INDEX idx_roles_name_uq ON public.roles USING btree (name) WHERE (deleted_at IS NULL);
CREATE INDEX idx_room_bookings_room_time ON public.room_bookings USING btree (room, start_time);
CREATE UNIQUE INDEX idx_room_events_booking_uq ON public.room_events USING btree (booking) WHERE (deleted_at IS NULL);
CREATE UNIQUE INDEX idx_room_projection_types_uq ON public.room_projection_types USING btree (room, projection_type) WHERE (deleted_at IS NULL);
CREATE UNIQUE INDEX idx_room_types_description_uq ON public.room_types USING btree (description) WHERE (deleted_at IS NULL);
CREATE UNIQUE INDEX idx_rooms_cinema_name_uq ON public.rooms USING btree (cinema, name) WHERE (deleted_at IS NULL);
CREATE UNIQUE INDEX idx_seat_categories_description_uq ON public.seat_categories USING btree (description) WHERE (deleted_at IS NULL);
CREATE UNIQUE INDEX idx_seat_conditions_description_uq ON public.seat_conditions USING btree (description) WHERE (deleted_at IS NULL);
CREATE UNIQUE INDEX idx_seats_room_row_col_uq ON public.seats USING btree (room, row_identifier, column_number) WHERE (deleted_at IS NULL);
CREATE UNIQUE INDEX idx_showtimes_booking_uq ON public.showtimes USING btree (booking) WHERE (deleted_at IS NULL);
CREATE INDEX idx_showtimes_movie ON public.showtimes USING btree (movie);
CREATE INDEX idx_tax_rules_cinema ON public.tax_rules USING btree (cinema);
CREATE INDEX idx_tax_rules_scope ON public.tax_rules USING btree (tax_scope);
CREATE UNIQUE INDEX idx_taxes_name_uq ON public.taxes USING btree (name) WHERE (deleted_at IS NULL);
CREATE UNIQUE INDEX idx_tickets_booking_seat_uq ON public.tickets USING btree (booking, seat) WHERE (deleted_at IS NULL);
CREATE INDEX idx_tickets_order ON public.tickets USING btree ("order");
CREATE UNIQUE INDEX idx_user_permissions_uq ON public.user_permissions USING btree ("user", permission) WHERE (deleted_at IS NULL);
CREATE UNIQUE INDEX idx_user_types_description_uq ON public.user_types USING btree (description) WHERE (deleted_at IS NULL);
CREATE UNIQUE INDEX idx_users_email_user_type_uq ON public.users USING btree (email, user_type) WHERE (deleted_at IS NULL);
CREATE UNIQUE INDEX idx_users_logins_jti_uq ON public.users_logins USING btree (jti) WHERE (deleted_at IS NULL);
CREATE INDEX idx_users_logins_user ON public.users_logins USING btree ("user");
CREATE UNIQUE INDEX idx_week_days_day_number_uq ON public.week_days USING btree (day_number) WHERE (deleted_at IS NULL);
