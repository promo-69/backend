--
-- PostgreSQL database dump
--

\restrict j5Nl1ATvzTVThuepxCgGVYkEs4dRjppI8iQqJmIO3Q8Cbeg5bcYzMxSiV252d5R

-- Dumped from database version 15.17
-- Dumped by pg_dump version 15.17

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: btree_gist; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS btree_gist WITH SCHEMA public;


--
-- Name: EXTENSION btree_gist; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION btree_gist IS 'support for indexing common datatypes in GiST';


--
-- Name: update_serial_sequence(text, text); Type: PROCEDURE; Schema: public; Owner: postgres
--

CREATE PROCEDURE public.update_serial_sequence(IN p_esquema text DEFAULT NULL::text, IN p_tabla text DEFAULT NULL::text)
    LANGUAGE plpgsql
    AS $$
            DECLARE
                secuencia_info RECORD;
                max_val BIGINT;
                row_count BIGINT;
                current_seq_val BIGINT;
                schema_filter TEXT := '';
                table_filter TEXT := '';
            BEGIN
                -- Construir filtros de manera segura
                IF p_esquema IS NOT NULL THEN
                    schema_filter := format(' AND n.nspname = %L', p_esquema);
                END IF;

                IF p_tabla IS NOT NULL THEN
                    table_filter := format(' AND c.relname = %L', p_tabla);
                END IF;

                -- Consulta para encontrar todas las secuencias SERIAL
                FOR secuencia_info IN EXECUTE '
                    SELECT
                        n.nspname AS schema_name,
                        c.relname AS table_name,
                        a.attname AS column_name,
                        s.relname AS sequence_name,
                        quote_ident(n.nspname) || ''.'' || quote_ident(s.relname) AS full_sequence_name
                    FROM
                        pg_class c
                    JOIN
                        pg_namespace n ON c.relnamespace = n.oid
                    JOIN
                        pg_attribute a ON a.attrelid = c.oid
                    JOIN
                        pg_depend d ON d.refobjid = c.oid AND d.refobjsubid = a.attnum
                    JOIN
                        pg_class s ON d.objid = s.oid
                    WHERE
                        d.deptype = ''a''  -- Automática (SERIAL)
                        AND s.relkind = ''S''  -- Es una secuencia
                        AND a.attnum > 0  -- Ignorar columnas del sistema
                        AND NOT a.attisdropped
                        AND a.attidentity = ''''  -- No es IDENTITY
                        AND a.attgenerated = ''''  -- No es generada
                        ' || schema_filter || ' ' || table_filter || '
                    ORDER BY
                        n.nspname, c.relname, a.attnum'
                LOOP
                    BEGIN
                        -- Obtener el número de registros y el máximo ID
                        EXECUTE format('SELECT COUNT(*), COALESCE(MAX(%I), 0) FROM %I.%I',
                                      secuencia_info.column_name,
                                      secuencia_info.schema_name,
                                      secuencia_info.table_name)
                        INTO row_count, max_val;

                        -- Obtener el valor actual de la secuencia
                        BEGIN
                            current_seq_val := nextval(secuencia_info.full_sequence_name) - 1;
                        EXCEPTION WHEN OTHERS THEN
                            current_seq_val := NULL;
                        END;

                        -- Actualizar la secuencia según corresponda
                        IF max_val > 0 THEN
                            -- Hay datos, actualizar la secuencia al máximo
                            PERFORM setval(secuencia_info.full_sequence_name, max_val, true);

                            RAISE NOTICE '%.% (%.%): [registros: %, id maximo: %, secuencial: %] -> %',
                                         secuencia_info.schema_name,
                                         secuencia_info.table_name,
                                         secuencia_info.schema_name,
                                         secuencia_info.sequence_name,
                                         row_count,
                                         max_val,
                                         COALESCE(current_seq_val::TEXT, 'N/A'),
                                         max_val;
                        ELSE
                            -- Tabla vacía, reiniciar la secuencia a 1
                            PERFORM setval(secuencia_info.full_sequence_name, 1, false);

                            RAISE NOTICE '%.% (%.%): [registros: 0, id maximo: 0, secuencial: %] -> 1',
                                         secuencia_info.schema_name,
                                         secuencia_info.table_name,
                                         secuencia_info.schema_name,
                                         secuencia_info.sequence_name,
                                         COALESCE(current_seq_val::TEXT, 'N/A');
                        END IF;

                    EXCEPTION WHEN OTHERS THEN
                        RAISE WARNING 'Error procesando %.%: %',
                                     secuencia_info.schema_name,
                                     secuencia_info.table_name,
                                     SQLERRM;
                    END;
                END LOOP;

                RAISE NOTICE '==========================================';
                RAISE NOTICE 'Proceso completado. Se actualizaron todas las secuencias SERIAL.';
            END;
            $$;


ALTER PROCEDURE public.update_serial_sequence(IN p_esquema text, IN p_tabla text) OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: SequelizeMeta; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."SequelizeMeta" (
    name character varying(255) NOT NULL
);


ALTER TABLE public."SequelizeMeta" OWNER TO postgres;

--
-- Name: actions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.actions (
    id integer NOT NULL,
    code character varying(100) NOT NULL,
    description character varying(255) NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.actions OWNER TO postgres;

--
-- Name: actions_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.actions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.actions_id_seq OWNER TO postgres;

--
-- Name: actions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.actions_id_seq OWNED BY public.actions.id;


--
-- Name: age_classifications; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.age_classifications (
    id integer NOT NULL,
    description character varying(255) NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.age_classifications OWNER TO postgres;

--
-- Name: age_classifications_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.age_classifications_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.age_classifications_id_seq OWNER TO postgres;

--
-- Name: age_classifications_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.age_classifications_id_seq OWNED BY public.age_classifications.id;


--
-- Name: audience_categories; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.audience_categories (
    id integer NOT NULL,
    description character varying(255) NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.audience_categories OWNER TO postgres;

--
-- Name: audience_categories_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.audience_categories_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.audience_categories_id_seq OWNER TO postgres;

--
-- Name: audience_categories_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.audience_categories_id_seq OWNED BY public.audience_categories.id;


--
-- Name: booking_types; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.booking_types (
    id integer NOT NULL,
    description character varying(255) NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.booking_types OWNER TO postgres;

--
-- Name: booking_types_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.booking_types_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.booking_types_id_seq OWNER TO postgres;

--
-- Name: booking_types_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.booking_types_id_seq OWNED BY public.booking_types.id;


--
-- Name: catalog_audit_logs; Type: TABLE; Schema: public; Owner: postgres
--

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


ALTER TABLE public.catalog_audit_logs OWNER TO postgres;

--
-- Name: COLUMN catalog_audit_logs.table_name; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.catalog_audit_logs.table_name IS 'Nombre de la tabla afectada (cinemas, rooms, seats, movies, etc.)';


--
-- Name: COLUMN catalog_audit_logs.record_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.catalog_audit_logs.record_id IS 'ID del registro afectado en la tabla de origen';


--
-- Name: COLUMN catalog_audit_logs.action; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.catalog_audit_logs.action IS 'Operación realizada: CREATE, UPDATE, DELETE';


--
-- Name: COLUMN catalog_audit_logs.changed_by; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.catalog_audit_logs.changed_by IS 'ID del usuario (users.id) que ejecutó la operación. NULL si fue el sistema.';


--
-- Name: COLUMN catalog_audit_logs.previous_data; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.catalog_audit_logs.previous_data IS 'Estado del registro ANTES del cambio. NULL en operaciones CREATE.';


--
-- Name: COLUMN catalog_audit_logs.new_data; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.catalog_audit_logs.new_data IS 'Estado del registro DESPUÉS del cambio. NULL en operaciones DELETE.';


--
-- Name: catalog_audit_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.catalog_audit_logs_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.catalog_audit_logs_id_seq OWNER TO postgres;

--
-- Name: catalog_audit_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.catalog_audit_logs_id_seq OWNED BY public.catalog_audit_logs.id;


--
-- Name: cinemas; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.cinemas (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    address text,
    phone character varying(50),
    opening_time time without time zone NOT NULL,
    closing_time time without time zone NOT NULL,
    deleted_at timestamp with time zone,
    CONSTRAINT chk_cinemas_times CHECK ((closing_time > opening_time))
);


ALTER TABLE public.cinemas OWNER TO postgres;

--
-- Name: cinemas_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.cinemas_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.cinemas_id_seq OWNER TO postgres;

--
-- Name: cinemas_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.cinemas_id_seq OWNED BY public.cinemas.id;


--
-- Name: combo_products; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.combo_products (
    id integer NOT NULL,
    combo integer NOT NULL,
    product integer NOT NULL,
    quantity integer NOT NULL,
    deleted_at timestamp with time zone,
    CONSTRAINT chk_combo_products_qty CHECK ((quantity > 0))
);


ALTER TABLE public.combo_products OWNER TO postgres;

--
-- Name: combo_products_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.combo_products_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.combo_products_id_seq OWNER TO postgres;

--
-- Name: combo_products_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.combo_products_id_seq OWNED BY public.combo_products.id;


--
-- Name: combos; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.combos (
    id integer NOT NULL,
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


ALTER TABLE public.combos OWNER TO postgres;

--
-- Name: combos_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.combos_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.combos_id_seq OWNER TO postgres;

--
-- Name: combos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.combos_id_seq OWNED BY public.combos.id;


--
-- Name: currencies; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.currencies (
    id integer NOT NULL,
    code character varying(10) NOT NULL,
    description character varying(255) NOT NULL,
    symbol character varying(10) NOT NULL,
    is_base_currency boolean NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.currencies OWNER TO postgres;

--
-- Name: currencies_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.currencies_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.currencies_id_seq OWNER TO postgres;

--
-- Name: currencies_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.currencies_id_seq OWNED BY public.currencies.id;


--
-- Name: customers; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.customers (
    id integer NOT NULL,
    person integer NOT NULL,
    loyalty_level integer DEFAULT 1 NOT NULL,
    level_progress_points integer DEFAULT 0 NOT NULL,
    current_points_balance integer DEFAULT 0 NOT NULL,
    registration_date timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at timestamp with time zone,
    CONSTRAINT chk_customers_progress CHECK ((level_progress_points >= 0)),
    CONSTRAINT chk_customers_pts_balance CHECK ((current_points_balance >= 0))
);


ALTER TABLE public.customers OWNER TO postgres;

--
-- Name: customers_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.customers_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.customers_id_seq OWNER TO postgres;

--
-- Name: customers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.customers_id_seq OWNED BY public.customers.id;


--
-- Name: employee_positions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.employee_positions (
    id integer NOT NULL,
    employee integer NOT NULL,
    job_position integer NOT NULL,
    cinema integer NOT NULL,
    start_date date NOT NULL,
    end_date date,
    salary_base numeric(10,2),
    deleted_at timestamp with time zone,
    CONSTRAINT chk_employee_positions_dates CHECK (((end_date IS NULL) OR (end_date >= start_date)))
);


ALTER TABLE public.employee_positions OWNER TO postgres;

--
-- Name: employee_positions_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.employee_positions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.employee_positions_id_seq OWNER TO postgres;

--
-- Name: employee_positions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.employee_positions_id_seq OWNED BY public.employee_positions.id;


--
-- Name: employees; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.employees (
    id integer NOT NULL,
    person integer NOT NULL,
    employee_code character varying(50) NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.employees OWNER TO postgres;

--
-- Name: employees_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.employees_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.employees_id_seq OWNER TO postgres;

--
-- Name: employees_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.employees_id_seq OWNED BY public.employees.id;


--
-- Name: exchange_rates; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.exchange_rates (
    id integer NOT NULL,
    currency integer NOT NULL,
    rate numeric(10,2) NOT NULL,
    "user" integer NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at timestamp with time zone,
    CONSTRAINT chk_exchange_rates_rate CHECK ((rate > (0)::numeric))
);


ALTER TABLE public.exchange_rates OWNER TO postgres;

--
-- Name: exchange_rates_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.exchange_rates_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.exchange_rates_id_seq OWNER TO postgres;

--
-- Name: exchange_rates_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.exchange_rates_id_seq OWNED BY public.exchange_rates.id;


--
-- Name: genders; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.genders (
    id integer NOT NULL,
    description character varying(255) NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.genders OWNER TO postgres;

--
-- Name: genders_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.genders_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.genders_id_seq OWNER TO postgres;

--
-- Name: genders_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.genders_id_seq OWNED BY public.genders.id;


--
-- Name: genres; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.genres (
    id integer NOT NULL,
    description character varying(255) NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.genres OWNER TO postgres;

--
-- Name: genres_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.genres_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.genres_id_seq OWNER TO postgres;

--
-- Name: genres_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.genres_id_seq OWNED BY public.genres.id;


--
-- Name: inventories; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.inventories (
    id integer NOT NULL,
    cinema integer NOT NULL,
    product integer NOT NULL,
    minimum_stock integer DEFAULT 0 NOT NULL,
    stock integer NOT NULL,
    current_unit_cost_base_currency numeric(10,2) DEFAULT 0 NOT NULL,
    deleted_at timestamp with time zone,
    CONSTRAINT chk_inventories_min_stock CHECK ((minimum_stock >= 0)),
    CONSTRAINT chk_inventories_stock CHECK ((stock >= 0)),
    CONSTRAINT chk_inventories_unit_cost CHECK ((current_unit_cost_base_currency >= (0)::numeric))
);


ALTER TABLE public.inventories OWNER TO postgres;

--
-- Name: inventories_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.inventories_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.inventories_id_seq OWNER TO postgres;

--
-- Name: inventories_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.inventories_id_seq OWNED BY public.inventories.id;


--
-- Name: inventory_movements; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.inventory_movements (
    id integer NOT NULL,
    inventory integer NOT NULL,
    operation_type integer NOT NULL,
    quantity integer NOT NULL,
    unit_cost numeric(10,2) DEFAULT 0 NOT NULL,
    currency integer DEFAULT 1 NOT NULL,
    "user" integer NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    remarks character varying(255),
    deleted_at timestamp with time zone,
    CONSTRAINT chk_inventory_movements_cost CHECK ((unit_cost >= (0)::numeric)),
    CONSTRAINT chk_inventory_movements_qty CHECK ((quantity > 0))
);


ALTER TABLE public.inventory_movements OWNER TO postgres;

--
-- Name: inventory_movements_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.inventory_movements_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.inventory_movements_id_seq OWNER TO postgres;

--
-- Name: inventory_movements_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.inventory_movements_id_seq OWNED BY public.inventory_movements.id;


--
-- Name: invoice_sequences; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.invoice_sequences (
    id integer NOT NULL,
    cinema integer NOT NULL,
    prefix character varying(10) NOT NULL,
    current_value integer DEFAULT 0 NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.invoice_sequences OWNER TO postgres;

--
-- Name: invoice_sequences_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.invoice_sequences_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.invoice_sequences_id_seq OWNER TO postgres;

--
-- Name: invoice_sequences_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.invoice_sequences_id_seq OWNED BY public.invoice_sequences.id;


--
-- Name: invoices; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.invoices (
    id integer NOT NULL,
    "order" integer NOT NULL,
    invoice_number character varying(100) NOT NULL,
    billing_document character varying(100) NOT NULL,
    billing_name character varying(255) NOT NULL,
    billing_address text,
    issued_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.invoices OWNER TO postgres;

--
-- Name: invoices_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.invoices_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.invoices_id_seq OWNER TO postgres;

--
-- Name: invoices_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.invoices_id_seq OWNED BY public.invoices.id;


--
-- Name: job_positions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.job_positions (
    id integer NOT NULL,
    title character varying(255) NOT NULL,
    description character varying(255),
    is_pensionable boolean DEFAULT false NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.job_positions OWNER TO postgres;

--
-- Name: job_positions_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.job_positions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.job_positions_id_seq OWNER TO postgres;

--
-- Name: job_positions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.job_positions_id_seq OWNED BY public.job_positions.id;


--
-- Name: line_types; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.line_types (
    id integer NOT NULL,
    description character varying(255) NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.line_types OWNER TO postgres;

--
-- Name: line_types_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.line_types_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.line_types_id_seq OWNER TO postgres;

--
-- Name: line_types_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.line_types_id_seq OWNED BY public.line_types.id;


--
-- Name: loyalty_ledgers; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.loyalty_ledgers (
    id integer NOT NULL,
    customer integer NOT NULL,
    "order" integer,
    operation_type integer NOT NULL,
    points integer NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at timestamp with time zone,
    CONSTRAINT chk_loyalty_ledgers_pts CHECK ((points > 0))
);


ALTER TABLE public.loyalty_ledgers OWNER TO postgres;

--
-- Name: loyalty_ledgers_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.loyalty_ledgers_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.loyalty_ledgers_id_seq OWNER TO postgres;

--
-- Name: loyalty_ledgers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.loyalty_ledgers_id_seq OWNED BY public.loyalty_ledgers.id;


--
-- Name: loyalty_levels; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.loyalty_levels (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    required_points integer,
    deleted_at timestamp with time zone,
    CONSTRAINT chk_loyalty_levels_pts CHECK ((required_points >= 0))
);


ALTER TABLE public.loyalty_levels OWNER TO postgres;

--
-- Name: loyalty_levels_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.loyalty_levels_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.loyalty_levels_id_seq OWNER TO postgres;

--
-- Name: loyalty_levels_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.loyalty_levels_id_seq OWNED BY public.loyalty_levels.id;


--
-- Name: modifier_scopes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.modifier_scopes (
    id integer NOT NULL,
    description character varying(255) NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.modifier_scopes OWNER TO postgres;

--
-- Name: modifier_scopes_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.modifier_scopes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.modifier_scopes_id_seq OWNER TO postgres;

--
-- Name: modifier_scopes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.modifier_scopes_id_seq OWNED BY public.modifier_scopes.id;


--
-- Name: movie_genres; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.movie_genres (
    id integer NOT NULL,
    movie integer NOT NULL,
    genre integer NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.movie_genres OWNER TO postgres;

--
-- Name: movie_genres_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.movie_genres_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.movie_genres_id_seq OWNER TO postgres;

--
-- Name: movie_genres_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.movie_genres_id_seq OWNED BY public.movie_genres.id;


--
-- Name: movie_lifecycle_states; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.movie_lifecycle_states (
    id integer NOT NULL,
    description character varying(255) NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.movie_lifecycle_states OWNER TO postgres;

--
-- Name: movie_lifecycle_states_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.movie_lifecycle_states_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.movie_lifecycle_states_id_seq OWNER TO postgres;

--
-- Name: movie_lifecycle_states_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.movie_lifecycle_states_id_seq OWNED BY public.movie_lifecycle_states.id;


--
-- Name: movie_subscriptions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.movie_subscriptions (
    id integer NOT NULL,
    customer integer NOT NULL,
    movie integer NOT NULL,
    is_notified boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.movie_subscriptions OWNER TO postgres;

--
-- Name: movie_subscriptions_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.movie_subscriptions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.movie_subscriptions_id_seq OWNER TO postgres;

--
-- Name: movie_subscriptions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.movie_subscriptions_id_seq OWNED BY public.movie_subscriptions.id;


--
-- Name: movies; Type: TABLE; Schema: public; Owner: postgres
--

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
    deleted_at timestamp with time zone,
    CONSTRAINT chk_movies_duration CHECK ((duration_minutes > 0))
);


ALTER TABLE public.movies OWNER TO postgres;

--
-- Name: movies_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.movies_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.movies_id_seq OWNER TO postgres;

--
-- Name: movies_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.movies_id_seq OWNED BY public.movies.id;


--
-- Name: operation_types; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.operation_types (
    id integer NOT NULL,
    description character varying(255) NOT NULL,
    is_increment boolean NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.operation_types OWNER TO postgres;

--
-- Name: operation_types_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.operation_types_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.operation_types_id_seq OWNER TO postgres;

--
-- Name: operation_types_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.operation_types_id_seq OWNED BY public.operation_types.id;


--
-- Name: order_lines; Type: TABLE; Schema: public; Owner: postgres
--

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
    quoted_exchange_rate integer NOT NULL,
    deleted_at timestamp with time zone,
    CONSTRAINT chk_order_lines_logic CHECK (((quantity > 0) AND (original_unit_price >= (0)::numeric) AND (unit_price >= (0)::numeric) AND (((line_type = 1) AND (product IS NOT NULL) AND (combo IS NULL)) OR ((line_type = 2) AND (product IS NULL) AND (combo IS NOT NULL)))))
);


ALTER TABLE public.order_lines OWNER TO postgres;

--
-- Name: order_lines_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.order_lines_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.order_lines_id_seq OWNER TO postgres;

--
-- Name: order_lines_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.order_lines_id_seq OWNED BY public.order_lines.id;


--
-- Name: order_payments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.order_payments (
    id integer NOT NULL,
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


ALTER TABLE public.order_payments OWNER TO postgres;

--
-- Name: order_payments_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.order_payments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.order_payments_id_seq OWNER TO postgres;

--
-- Name: order_payments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.order_payments_id_seq OWNED BY public.order_payments.id;


--
-- Name: order_statuses; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.order_statuses (
    id integer NOT NULL,
    description character varying(255) NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.order_statuses OWNER TO postgres;

--
-- Name: order_statuses_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.order_statuses_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.order_statuses_id_seq OWNER TO postgres;

--
-- Name: order_statuses_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.order_statuses_id_seq OWNED BY public.order_statuses.id;


--
-- Name: order_taxes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.order_taxes (
    id integer NOT NULL,
    "order" integer NOT NULL,
    tax integer NOT NULL,
    applied_rate numeric(10,2) NOT NULL,
    tax_amount_base_currency numeric(10,2) NOT NULL,
    deleted_at timestamp with time zone,
    CONSTRAINT chk_order_taxes_amounts CHECK (((applied_rate >= (0)::numeric) AND (tax_amount_base_currency >= (0)::numeric)))
);


ALTER TABLE public.order_taxes OWNER TO postgres;

--
-- Name: order_taxes_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.order_taxes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.order_taxes_id_seq OWNER TO postgres;

--
-- Name: order_taxes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.order_taxes_id_seq OWNED BY public.order_taxes.id;


--
-- Name: orders; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.orders (
    id integer NOT NULL,
    customer integer NOT NULL,
    employee integer,
    cinema integer NOT NULL,
    system_base_currency integer NOT NULL,
    subtotal_base_currency numeric(10,2) NOT NULL,
    tax_amount_base_currency numeric(10,2) NOT NULL,
    total_amount_base_currency numeric(10,2) NOT NULL,
    generated_points integer NOT NULL,
    order_status integer DEFAULT 1 NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at timestamp with time zone,
    CONSTRAINT chk_orders_amounts CHECK (((subtotal_base_currency >= (0)::numeric) AND (tax_amount_base_currency >= (0)::numeric) AND (total_amount_base_currency >= (0)::numeric) AND (generated_points >= 0)))
);


ALTER TABLE public.orders OWNER TO postgres;

--
-- Name: orders_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.orders_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.orders_id_seq OWNER TO postgres;

--
-- Name: orders_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.orders_id_seq OWNED BY public.orders.id;


--
-- Name: payment_methods; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.payment_methods (
    id integer NOT NULL,
    description character varying(255) NOT NULL,
    requires_reference boolean NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.payment_methods OWNER TO postgres;

--
-- Name: payment_methods_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.payment_methods_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.payment_methods_id_seq OWNER TO postgres;

--
-- Name: payment_methods_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.payment_methods_id_seq OWNED BY public.payment_methods.id;


--
-- Name: people; Type: TABLE; Schema: public; Owner: postgres
--

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
    deleted_at timestamp with time zone
);


ALTER TABLE public.people OWNER TO postgres;

--
-- Name: people_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.people_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.people_id_seq OWNER TO postgres;

--
-- Name: people_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.people_id_seq OWNED BY public.people.id;


--
-- Name: permission_types; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.permission_types (
    id integer NOT NULL,
    code character varying(100) NOT NULL,
    description character varying(255) NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.permission_types OWNER TO postgres;

--
-- Name: permission_types_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.permission_types_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.permission_types_id_seq OWNER TO postgres;

--
-- Name: permission_types_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.permission_types_id_seq OWNED BY public.permission_types.id;


--
-- Name: permissions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.permissions (
    id integer NOT NULL,
    action integer NOT NULL,
    resource integer NOT NULL,
    permission_type integer NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.permissions OWNER TO postgres;

--
-- Name: permissions_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.permissions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.permissions_id_seq OWNER TO postgres;

--
-- Name: permissions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.permissions_id_seq OWNED BY public.permissions.id;


--
-- Name: price_modifiers; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.price_modifiers (
    id integer NOT NULL,
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
    target_currency integer,
    target_currency_condition boolean DEFAULT false,
    deleted_at timestamp with time zone,
    CONSTRAINT chk_price_modifiers_dates CHECK (((start_date IS NULL) OR (end_date IS NULL) OR (end_date >= start_date))),
    CONSTRAINT chk_price_modifiers_logic CHECK (((value > (0)::numeric) AND (((modifier_scope = 1) AND (product_category IS NULL) AND (product IS NULL) AND (combo IS NULL) AND (line_type IS NULL)) OR ((modifier_scope = 2) AND (audience_category IS NULL) AND (seat_category IS NULL) AND (projection_type IS NULL)) OR ((modifier_scope = 3) AND (product_category IS NULL) AND (product IS NULL) AND (combo IS NULL) AND (audience_category IS NULL) AND (seat_category IS NULL) AND (projection_type IS NULL) AND (line_type IS NULL))))),
    CONSTRAINT chk_price_modifiers_times CHECK (((start_time IS NULL) OR (end_time IS NULL) OR (end_time > start_time)))
);


ALTER TABLE public.price_modifiers OWNER TO postgres;

--
-- Name: price_modifiers_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.price_modifiers_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.price_modifiers_id_seq OWNER TO postgres;

--
-- Name: price_modifiers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.price_modifiers_id_seq OWNED BY public.price_modifiers.id;


--
-- Name: product_categories; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.product_categories (
    id integer NOT NULL,
    description character varying(255) NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.product_categories OWNER TO postgres;

--
-- Name: product_categories_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.product_categories_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.product_categories_id_seq OWNER TO postgres;

--
-- Name: product_categories_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.product_categories_id_seq OWNED BY public.product_categories.id;


--
-- Name: products; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.products (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    sku character varying(100) NOT NULL,
    image_url character varying(500),
    product_category integer NOT NULL,
    currency integer NOT NULL,
    price numeric(10,2) NOT NULL,
    earned_loyalty_points integer,
    deleted_at timestamp with time zone
);


ALTER TABLE public.products OWNER TO postgres;

--
-- Name: products_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.products_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.products_id_seq OWNER TO postgres;

--
-- Name: products_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.products_id_seq OWNED BY public.products.id;


--
-- Name: projection_types; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.projection_types (
    id integer NOT NULL,
    description character varying(255) NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.projection_types OWNER TO postgres;

--
-- Name: projection_types_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.projection_types_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.projection_types_id_seq OWNER TO postgres;

--
-- Name: projection_types_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.projection_types_id_seq OWNED BY public.projection_types.id;


--
-- Name: rental_requests; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.rental_requests (
    id integer NOT NULL,
    customer integer NOT NULL,
    room integer NOT NULL,
    booking integer,
    event_type integer NOT NULL,
    requested_start_time timestamp with time zone NOT NULL,
    requested_end_time timestamp with time zone NOT NULL,
    event_name character varying(255) NOT NULL,
    event_description text,
    status integer NOT NULL,
    currency integer,
    price numeric(10,2),
    deleted_at timestamp with time zone
);


ALTER TABLE public.rental_requests OWNER TO postgres;

--
-- Name: rental_requests_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.rental_requests_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.rental_requests_id_seq OWNER TO postgres;

--
-- Name: rental_requests_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.rental_requests_id_seq OWNED BY public.rental_requests.id;


--
-- Name: resources; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.resources (
    id integer NOT NULL,
    code character varying(100) NOT NULL,
    description character varying(255) NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.resources OWNER TO postgres;

--
-- Name: resources_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.resources_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.resources_id_seq OWNER TO postgres;

--
-- Name: resources_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.resources_id_seq OWNED BY public.resources.id;


--
-- Name: role_inheritances; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.role_inheritances (
    id integer NOT NULL,
    parent_role integer NOT NULL,
    child_role integer NOT NULL,
    deleted_at timestamp with time zone,
    CONSTRAINT chk_role_inheritances_diff CHECK ((parent_role <> child_role))
);


ALTER TABLE public.role_inheritances OWNER TO postgres;

--
-- Name: role_inheritances_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.role_inheritances_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.role_inheritances_id_seq OWNER TO postgres;

--
-- Name: role_inheritances_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.role_inheritances_id_seq OWNED BY public.role_inheritances.id;


--
-- Name: role_permissions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.role_permissions (
    id integer NOT NULL,
    role integer NOT NULL,
    permission integer NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.role_permissions OWNER TO postgres;

--
-- Name: role_permissions_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.role_permissions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.role_permissions_id_seq OWNER TO postgres;

--
-- Name: role_permissions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.role_permissions_id_seq OWNED BY public.role_permissions.id;


--
-- Name: roles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.roles (
    id integer NOT NULL,
    code character varying(50) NOT NULL,
    name character varying(100) NOT NULL,
    description character varying(255) NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.roles OWNER TO postgres;

--
-- Name: roles_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.roles_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.roles_id_seq OWNER TO postgres;

--
-- Name: roles_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.roles_id_seq OWNED BY public.roles.id;


--
-- Name: room_bookings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.room_bookings (
    id integer NOT NULL,
    room integer NOT NULL,
    start_time timestamp with time zone NOT NULL,
    end_time timestamp with time zone NOT NULL,
    booking_type integer NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.room_bookings OWNER TO postgres;

--
-- Name: room_bookings_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.room_bookings_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.room_bookings_id_seq OWNER TO postgres;

--
-- Name: room_bookings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.room_bookings_id_seq OWNED BY public.room_bookings.id;


--
-- Name: room_events; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.room_events (
    id integer NOT NULL,
    booking integer NOT NULL,
    event_type integer NOT NULL,
    name character varying(255) NOT NULL,
    organizer character varying(255),
    description text,
    currency integer NOT NULL,
    price numeric(10,2) NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.room_events OWNER TO postgres;

--
-- Name: room_events_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.room_events_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.room_events_id_seq OWNER TO postgres;

--
-- Name: room_events_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.room_events_id_seq OWNED BY public.room_events.id;


--
-- Name: room_projection_types; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.room_projection_types (
    id integer NOT NULL,
    room integer NOT NULL,
    projection_type integer NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.room_projection_types OWNER TO postgres;

--
-- Name: room_projection_types_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.room_projection_types_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.room_projection_types_id_seq OWNER TO postgres;

--
-- Name: room_projection_types_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.room_projection_types_id_seq OWNED BY public.room_projection_types.id;


--
-- Name: rooms; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.rooms (
    id integer NOT NULL,
    cinema integer NOT NULL,
    name character varying(100) NOT NULL,
    grid_rows integer NOT NULL,
    grid_columns integer NOT NULL,
    deleted_at timestamp with time zone,
    CONSTRAINT chk_rooms_capacity CHECK (((grid_rows > 0) AND (grid_columns > 0)))
);


ALTER TABLE public.rooms OWNER TO postgres;

--
-- Name: rooms_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.rooms_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.rooms_id_seq OWNER TO postgres;

--
-- Name: rooms_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.rooms_id_seq OWNED BY public.rooms.id;


--
-- Name: seat_categories; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.seat_categories (
    id integer NOT NULL,
    description character varying(255) NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.seat_categories OWNER TO postgres;

--
-- Name: seat_categories_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.seat_categories_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.seat_categories_id_seq OWNER TO postgres;

--
-- Name: seat_categories_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.seat_categories_id_seq OWNED BY public.seat_categories.id;


--
-- Name: seat_conditions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.seat_conditions (
    id integer NOT NULL,
    description character varying(255) NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.seat_conditions OWNER TO postgres;

--
-- Name: seat_conditions_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.seat_conditions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.seat_conditions_id_seq OWNER TO postgres;

--
-- Name: seat_conditions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.seat_conditions_id_seq OWNED BY public.seat_conditions.id;


--
-- Name: seats; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.seats (
    id integer NOT NULL,
    room integer NOT NULL,
    row_identifier character varying(2) NOT NULL,
    column_number integer NOT NULL,
    seat_category integer NOT NULL,
    seat_condition integer NOT NULL,
    deleted_at timestamp with time zone,
    CONSTRAINT chk_seats_col CHECK ((column_number > 0))
);


ALTER TABLE public.seats OWNER TO postgres;

--
-- Name: seats_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.seats_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.seats_id_seq OWNER TO postgres;

--
-- Name: seats_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.seats_id_seq OWNED BY public.seats.id;


--
-- Name: showtimes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.showtimes (
    id integer NOT NULL,
    booking integer NOT NULL,
    movie integer NOT NULL,
    projection_type integer NOT NULL,
    currency integer NOT NULL,
    price numeric(10,2) NOT NULL,
    earned_loyalty_points integer,
    deleted_at timestamp with time zone
);


ALTER TABLE public.showtimes OWNER TO postgres;

--
-- Name: showtimes_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.showtimes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.showtimes_id_seq OWNER TO postgres;

--
-- Name: showtimes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.showtimes_id_seq OWNED BY public.showtimes.id;


--
-- Name: tax_rules; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tax_rules (
    id integer NOT NULL,
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


ALTER TABLE public.tax_rules OWNER TO postgres;

--
-- Name: tax_rules_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.tax_rules_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.tax_rules_id_seq OWNER TO postgres;

--
-- Name: tax_rules_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.tax_rules_id_seq OWNED BY public.tax_rules.id;


--
-- Name: taxes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.taxes (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    rate numeric(10,2) NOT NULL,
    is_percentage boolean DEFAULT true NOT NULL,
    deleted_at timestamp with time zone,
    CONSTRAINT chk_taxes_rate CHECK ((rate >= (0)::numeric))
);


ALTER TABLE public.taxes OWNER TO postgres;

--
-- Name: taxes_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.taxes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.taxes_id_seq OWNER TO postgres;

--
-- Name: taxes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.taxes_id_seq OWNED BY public.taxes.id;


--
-- Name: tickets; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tickets (
    id integer NOT NULL,
    "order" integer NOT NULL,
    showtime integer NOT NULL,
    seat integer NOT NULL,
    original_price numeric(10,2) NOT NULL,
    price_modifier integer,
    price numeric(10,2) NOT NULL,
    quoted_exchange_rate integer NOT NULL,
    qr_code character varying(500) NOT NULL,
    validation_time timestamp with time zone,
    deleted_at timestamp with time zone,
    CONSTRAINT chk_tickets_prices CHECK (((original_price >= (0)::numeric) AND (price >= (0)::numeric)))
);


ALTER TABLE public.tickets OWNER TO postgres;

--
-- Name: tickets_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.tickets_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.tickets_id_seq OWNER TO postgres;

--
-- Name: tickets_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.tickets_id_seq OWNED BY public.tickets.id;


--
-- Name: user_permissions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_permissions (
    id integer NOT NULL,
    "user" integer NOT NULL,
    permission integer NOT NULL,
    is_granted boolean NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.user_permissions OWNER TO postgres;

--
-- Name: user_permissions_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.user_permissions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.user_permissions_id_seq OWNER TO postgres;

--
-- Name: user_permissions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.user_permissions_id_seq OWNED BY public.user_permissions.id;


--
-- Name: user_types; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_types (
    id integer NOT NULL,
    description character varying(255) NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.user_types OWNER TO postgres;

--
-- Name: user_types_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.user_types_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.user_types_id_seq OWNER TO postgres;

--
-- Name: user_types_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.user_types_id_seq OWNED BY public.user_types.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id integer NOT NULL,
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


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.users_id_seq OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: users_logins; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users_logins (
    id integer NOT NULL,
    "user" integer NOT NULL,
    device character varying(500),
    jti character varying(255) NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone,
    deleted_at timestamp with time zone
);


ALTER TABLE public.users_logins OWNER TO postgres;

--
-- Name: users_logins_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.users_logins_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.users_logins_id_seq OWNER TO postgres;

--
-- Name: users_logins_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_logins_id_seq OWNED BY public.users_logins.id;


--
-- Name: week_days; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.week_days (
    id integer NOT NULL,
    description character varying(50) NOT NULL,
    day_number integer NOT NULL,
    deleted_at timestamp with time zone,
    CONSTRAINT chk_week_days_range CHECK (((day_number >= 1) AND (day_number <= 7)))
);


ALTER TABLE public.week_days OWNER TO postgres;

--
-- Name: week_days_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.week_days_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.week_days_id_seq OWNER TO postgres;

--
-- Name: week_days_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.week_days_id_seq OWNED BY public.week_days.id;


--
-- Name: actions id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.actions ALTER COLUMN id SET DEFAULT nextval('public.actions_id_seq'::regclass);


--
-- Name: age_classifications id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.age_classifications ALTER COLUMN id SET DEFAULT nextval('public.age_classifications_id_seq'::regclass);


--
-- Name: audience_categories id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audience_categories ALTER COLUMN id SET DEFAULT nextval('public.audience_categories_id_seq'::regclass);


--
-- Name: booking_types id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.booking_types ALTER COLUMN id SET DEFAULT nextval('public.booking_types_id_seq'::regclass);


--
-- Name: catalog_audit_logs id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.catalog_audit_logs ALTER COLUMN id SET DEFAULT nextval('public.catalog_audit_logs_id_seq'::regclass);


--
-- Name: cinemas id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cinemas ALTER COLUMN id SET DEFAULT nextval('public.cinemas_id_seq'::regclass);


--
-- Name: combo_products id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.combo_products ALTER COLUMN id SET DEFAULT nextval('public.combo_products_id_seq'::regclass);


--
-- Name: combos id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.combos ALTER COLUMN id SET DEFAULT nextval('public.combos_id_seq'::regclass);


--
-- Name: currencies id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.currencies ALTER COLUMN id SET DEFAULT nextval('public.currencies_id_seq'::regclass);


--
-- Name: customers id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.customers ALTER COLUMN id SET DEFAULT nextval('public.customers_id_seq'::regclass);


--
-- Name: employee_positions id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employee_positions ALTER COLUMN id SET DEFAULT nextval('public.employee_positions_id_seq'::regclass);


--
-- Name: employees id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employees ALTER COLUMN id SET DEFAULT nextval('public.employees_id_seq'::regclass);


--
-- Name: exchange_rates id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.exchange_rates ALTER COLUMN id SET DEFAULT nextval('public.exchange_rates_id_seq'::regclass);


--
-- Name: genders id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.genders ALTER COLUMN id SET DEFAULT nextval('public.genders_id_seq'::regclass);


--
-- Name: genres id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.genres ALTER COLUMN id SET DEFAULT nextval('public.genres_id_seq'::regclass);


--
-- Name: inventories id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inventories ALTER COLUMN id SET DEFAULT nextval('public.inventories_id_seq'::regclass);


--
-- Name: inventory_movements id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inventory_movements ALTER COLUMN id SET DEFAULT nextval('public.inventory_movements_id_seq'::regclass);


--
-- Name: invoice_sequences id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.invoice_sequences ALTER COLUMN id SET DEFAULT nextval('public.invoice_sequences_id_seq'::regclass);


--
-- Name: invoices id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.invoices ALTER COLUMN id SET DEFAULT nextval('public.invoices_id_seq'::regclass);


--
-- Name: job_positions id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.job_positions ALTER COLUMN id SET DEFAULT nextval('public.job_positions_id_seq'::regclass);


--
-- Name: line_types id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.line_types ALTER COLUMN id SET DEFAULT nextval('public.line_types_id_seq'::regclass);


--
-- Name: loyalty_ledgers id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.loyalty_ledgers ALTER COLUMN id SET DEFAULT nextval('public.loyalty_ledgers_id_seq'::regclass);


--
-- Name: loyalty_levels id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.loyalty_levels ALTER COLUMN id SET DEFAULT nextval('public.loyalty_levels_id_seq'::regclass);


--
-- Name: modifier_scopes id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.modifier_scopes ALTER COLUMN id SET DEFAULT nextval('public.modifier_scopes_id_seq'::regclass);


--
-- Name: movie_genres id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.movie_genres ALTER COLUMN id SET DEFAULT nextval('public.movie_genres_id_seq'::regclass);


--
-- Name: movie_lifecycle_states id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.movie_lifecycle_states ALTER COLUMN id SET DEFAULT nextval('public.movie_lifecycle_states_id_seq'::regclass);


--
-- Name: movie_subscriptions id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.movie_subscriptions ALTER COLUMN id SET DEFAULT nextval('public.movie_subscriptions_id_seq'::regclass);


--
-- Name: movies id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.movies ALTER COLUMN id SET DEFAULT nextval('public.movies_id_seq'::regclass);


--
-- Name: operation_types id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.operation_types ALTER COLUMN id SET DEFAULT nextval('public.operation_types_id_seq'::regclass);


--
-- Name: order_lines id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_lines ALTER COLUMN id SET DEFAULT nextval('public.order_lines_id_seq'::regclass);


--
-- Name: order_payments id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_payments ALTER COLUMN id SET DEFAULT nextval('public.order_payments_id_seq'::regclass);


--
-- Name: order_statuses id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_statuses ALTER COLUMN id SET DEFAULT nextval('public.order_statuses_id_seq'::regclass);


--
-- Name: order_taxes id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_taxes ALTER COLUMN id SET DEFAULT nextval('public.order_taxes_id_seq'::regclass);


--
-- Name: orders id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders ALTER COLUMN id SET DEFAULT nextval('public.orders_id_seq'::regclass);


--
-- Name: payment_methods id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payment_methods ALTER COLUMN id SET DEFAULT nextval('public.payment_methods_id_seq'::regclass);


--
-- Name: people id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.people ALTER COLUMN id SET DEFAULT nextval('public.people_id_seq'::regclass);


--
-- Name: permission_types id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.permission_types ALTER COLUMN id SET DEFAULT nextval('public.permission_types_id_seq'::regclass);


--
-- Name: permissions id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.permissions ALTER COLUMN id SET DEFAULT nextval('public.permissions_id_seq'::regclass);


--
-- Name: price_modifiers id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.price_modifiers ALTER COLUMN id SET DEFAULT nextval('public.price_modifiers_id_seq'::regclass);


--
-- Name: product_categories id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.product_categories ALTER COLUMN id SET DEFAULT nextval('public.product_categories_id_seq'::regclass);


--
-- Name: products id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products ALTER COLUMN id SET DEFAULT nextval('public.products_id_seq'::regclass);


--
-- Name: projection_types id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.projection_types ALTER COLUMN id SET DEFAULT nextval('public.projection_types_id_seq'::regclass);


--
-- Name: rental_requests id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rental_requests ALTER COLUMN id SET DEFAULT nextval('public.rental_requests_id_seq'::regclass);


--
-- Name: resources id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.resources ALTER COLUMN id SET DEFAULT nextval('public.resources_id_seq'::regclass);


--
-- Name: role_inheritances id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.role_inheritances ALTER COLUMN id SET DEFAULT nextval('public.role_inheritances_id_seq'::regclass);


--
-- Name: role_permissions id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.role_permissions ALTER COLUMN id SET DEFAULT nextval('public.role_permissions_id_seq'::regclass);


--
-- Name: roles id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles ALTER COLUMN id SET DEFAULT nextval('public.roles_id_seq'::regclass);


--
-- Name: room_bookings id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.room_bookings ALTER COLUMN id SET DEFAULT nextval('public.room_bookings_id_seq'::regclass);


--
-- Name: room_events id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.room_events ALTER COLUMN id SET DEFAULT nextval('public.room_events_id_seq'::regclass);


--
-- Name: room_projection_types id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.room_projection_types ALTER COLUMN id SET DEFAULT nextval('public.room_projection_types_id_seq'::regclass);


--
-- Name: rooms id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rooms ALTER COLUMN id SET DEFAULT nextval('public.rooms_id_seq'::regclass);


--
-- Name: seat_categories id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.seat_categories ALTER COLUMN id SET DEFAULT nextval('public.seat_categories_id_seq'::regclass);


--
-- Name: seat_conditions id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.seat_conditions ALTER COLUMN id SET DEFAULT nextval('public.seat_conditions_id_seq'::regclass);


--
-- Name: seats id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.seats ALTER COLUMN id SET DEFAULT nextval('public.seats_id_seq'::regclass);


--
-- Name: showtimes id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.showtimes ALTER COLUMN id SET DEFAULT nextval('public.showtimes_id_seq'::regclass);


--
-- Name: tax_rules id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tax_rules ALTER COLUMN id SET DEFAULT nextval('public.tax_rules_id_seq'::regclass);


--
-- Name: taxes id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.taxes ALTER COLUMN id SET DEFAULT nextval('public.taxes_id_seq'::regclass);


--
-- Name: tickets id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tickets ALTER COLUMN id SET DEFAULT nextval('public.tickets_id_seq'::regclass);


--
-- Name: user_permissions id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_permissions ALTER COLUMN id SET DEFAULT nextval('public.user_permissions_id_seq'::regclass);


--
-- Name: user_types id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_types ALTER COLUMN id SET DEFAULT nextval('public.user_types_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Name: users_logins id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users_logins ALTER COLUMN id SET DEFAULT nextval('public.users_logins_id_seq'::regclass);


--
-- Name: week_days id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.week_days ALTER COLUMN id SET DEFAULT nextval('public.week_days_id_seq'::regclass);


--
-- Name: SequelizeMeta SequelizeMeta_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."SequelizeMeta"
    ADD CONSTRAINT "SequelizeMeta_pkey" PRIMARY KEY (name);


--
-- Name: actions actions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.actions
    ADD CONSTRAINT actions_pkey PRIMARY KEY (id);


--
-- Name: age_classifications age_classifications_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.age_classifications
    ADD CONSTRAINT age_classifications_pkey PRIMARY KEY (id);


--
-- Name: audience_categories audience_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audience_categories
    ADD CONSTRAINT audience_categories_pkey PRIMARY KEY (id);


--
-- Name: booking_types booking_types_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.booking_types
    ADD CONSTRAINT booking_types_pkey PRIMARY KEY (id);


--
-- Name: catalog_audit_logs catalog_audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.catalog_audit_logs
    ADD CONSTRAINT catalog_audit_logs_pkey PRIMARY KEY (id);


--
-- Name: room_bookings chk_room_bookings_no_overlap; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.room_bookings
    ADD CONSTRAINT chk_room_bookings_no_overlap EXCLUDE USING gist (room WITH =, tstzrange(start_time, end_time) WITH &&) WHERE ((deleted_at IS NULL));


--
-- Name: cinemas cinemas_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cinemas
    ADD CONSTRAINT cinemas_pkey PRIMARY KEY (id);


--
-- Name: combo_products combo_products_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.combo_products
    ADD CONSTRAINT combo_products_pkey PRIMARY KEY (id);


--
-- Name: combos combos_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.combos
    ADD CONSTRAINT combos_pkey PRIMARY KEY (id);


--
-- Name: currencies currencies_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.currencies
    ADD CONSTRAINT currencies_pkey PRIMARY KEY (id);


--
-- Name: customers customers_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.customers
    ADD CONSTRAINT customers_pkey PRIMARY KEY (id);


--
-- Name: employee_positions employee_positions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employee_positions
    ADD CONSTRAINT employee_positions_pkey PRIMARY KEY (id);


--
-- Name: employees employees_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employees
    ADD CONSTRAINT employees_pkey PRIMARY KEY (id);


--
-- Name: exchange_rates exchange_rates_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.exchange_rates
    ADD CONSTRAINT exchange_rates_pkey PRIMARY KEY (id);


--
-- Name: genders genders_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.genders
    ADD CONSTRAINT genders_pkey PRIMARY KEY (id);


--
-- Name: genres genres_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.genres
    ADD CONSTRAINT genres_pkey PRIMARY KEY (id);


--
-- Name: inventories inventories_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inventories
    ADD CONSTRAINT inventories_pkey PRIMARY KEY (id);


--
-- Name: inventory_movements inventory_movements_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inventory_movements
    ADD CONSTRAINT inventory_movements_pkey PRIMARY KEY (id);


--
-- Name: invoice_sequences invoice_sequences_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.invoice_sequences
    ADD CONSTRAINT invoice_sequences_pkey PRIMARY KEY (id);


--
-- Name: invoices invoices_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_pkey PRIMARY KEY (id);


--
-- Name: job_positions job_positions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.job_positions
    ADD CONSTRAINT job_positions_pkey PRIMARY KEY (id);


--
-- Name: line_types line_types_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.line_types
    ADD CONSTRAINT line_types_pkey PRIMARY KEY (id);


--
-- Name: loyalty_ledgers loyalty_ledgers_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.loyalty_ledgers
    ADD CONSTRAINT loyalty_ledgers_pkey PRIMARY KEY (id);


--
-- Name: loyalty_levels loyalty_levels_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.loyalty_levels
    ADD CONSTRAINT loyalty_levels_pkey PRIMARY KEY (id);


--
-- Name: modifier_scopes modifier_scopes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.modifier_scopes
    ADD CONSTRAINT modifier_scopes_pkey PRIMARY KEY (id);


--
-- Name: movie_genres movie_genres_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.movie_genres
    ADD CONSTRAINT movie_genres_pkey PRIMARY KEY (id);


--
-- Name: movie_lifecycle_states movie_lifecycle_states_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.movie_lifecycle_states
    ADD CONSTRAINT movie_lifecycle_states_pkey PRIMARY KEY (id);


--
-- Name: movie_subscriptions movie_subscriptions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.movie_subscriptions
    ADD CONSTRAINT movie_subscriptions_pkey PRIMARY KEY (id);


--
-- Name: movies movies_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.movies
    ADD CONSTRAINT movies_pkey PRIMARY KEY (id);


--
-- Name: operation_types operation_types_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.operation_types
    ADD CONSTRAINT operation_types_pkey PRIMARY KEY (id);


--
-- Name: order_lines order_lines_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_lines
    ADD CONSTRAINT order_lines_pkey PRIMARY KEY (id);


--
-- Name: order_payments order_payments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_payments
    ADD CONSTRAINT order_payments_pkey PRIMARY KEY (id);


--
-- Name: order_statuses order_statuses_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_statuses
    ADD CONSTRAINT order_statuses_pkey PRIMARY KEY (id);


--
-- Name: order_taxes order_taxes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_taxes
    ADD CONSTRAINT order_taxes_pkey PRIMARY KEY (id);


--
-- Name: orders orders_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_pkey PRIMARY KEY (id);


--
-- Name: payment_methods payment_methods_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payment_methods
    ADD CONSTRAINT payment_methods_pkey PRIMARY KEY (id);


--
-- Name: people people_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.people
    ADD CONSTRAINT people_pkey PRIMARY KEY (id);


--
-- Name: permission_types permission_types_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.permission_types
    ADD CONSTRAINT permission_types_pkey PRIMARY KEY (id);


--
-- Name: permissions permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.permissions
    ADD CONSTRAINT permissions_pkey PRIMARY KEY (id);


--
-- Name: price_modifiers price_modifiers_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.price_modifiers
    ADD CONSTRAINT price_modifiers_pkey PRIMARY KEY (id);


--
-- Name: product_categories product_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.product_categories
    ADD CONSTRAINT product_categories_pkey PRIMARY KEY (id);


--
-- Name: products products_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_pkey PRIMARY KEY (id);


--
-- Name: projection_types projection_types_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.projection_types
    ADD CONSTRAINT projection_types_pkey PRIMARY KEY (id);


--
-- Name: rental_requests rental_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rental_requests
    ADD CONSTRAINT rental_requests_pkey PRIMARY KEY (id);


--
-- Name: resources resources_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.resources
    ADD CONSTRAINT resources_pkey PRIMARY KEY (id);


--
-- Name: role_inheritances role_inheritances_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.role_inheritances
    ADD CONSTRAINT role_inheritances_pkey PRIMARY KEY (id);


--
-- Name: role_permissions role_permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_pkey PRIMARY KEY (id);


--
-- Name: roles roles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (id);


--
-- Name: room_bookings room_bookings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.room_bookings
    ADD CONSTRAINT room_bookings_pkey PRIMARY KEY (id);


--
-- Name: room_events room_events_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.room_events
    ADD CONSTRAINT room_events_pkey PRIMARY KEY (id);


--
-- Name: room_projection_types room_projection_types_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.room_projection_types
    ADD CONSTRAINT room_projection_types_pkey PRIMARY KEY (id);


--
-- Name: rooms rooms_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rooms
    ADD CONSTRAINT rooms_pkey PRIMARY KEY (id);


--
-- Name: seat_categories seat_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.seat_categories
    ADD CONSTRAINT seat_categories_pkey PRIMARY KEY (id);


--
-- Name: seat_conditions seat_conditions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.seat_conditions
    ADD CONSTRAINT seat_conditions_pkey PRIMARY KEY (id);


--
-- Name: seats seats_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.seats
    ADD CONSTRAINT seats_pkey PRIMARY KEY (id);


--
-- Name: showtimes showtimes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.showtimes
    ADD CONSTRAINT showtimes_pkey PRIMARY KEY (id);


--
-- Name: tax_rules tax_rules_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tax_rules
    ADD CONSTRAINT tax_rules_pkey PRIMARY KEY (id);


--
-- Name: taxes taxes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.taxes
    ADD CONSTRAINT taxes_pkey PRIMARY KEY (id);


--
-- Name: tickets tickets_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tickets
    ADD CONSTRAINT tickets_pkey PRIMARY KEY (id);


--
-- Name: user_permissions user_permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_permissions
    ADD CONSTRAINT user_permissions_pkey PRIMARY KEY (id);


--
-- Name: user_types user_types_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_types
    ADD CONSTRAINT user_types_pkey PRIMARY KEY (id);


--
-- Name: users_logins users_logins_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users_logins
    ADD CONSTRAINT users_logins_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: week_days week_days_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.week_days
    ADD CONSTRAINT week_days_pkey PRIMARY KEY (id);


--
-- Name: idx_actions_code_uq; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX idx_actions_code_uq ON public.actions USING btree (code) WHERE (deleted_at IS NULL);


--
-- Name: idx_age_classifications_description_uq; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX idx_age_classifications_description_uq ON public.age_classifications USING btree (description) WHERE (deleted_at IS NULL);


--
-- Name: idx_audience_categories_description_uq; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX idx_audience_categories_description_uq ON public.audience_categories USING btree (description) WHERE (deleted_at IS NULL);


--
-- Name: idx_audit_logs_changed_by; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_audit_logs_changed_by ON public.catalog_audit_logs USING btree (changed_by);


--
-- Name: idx_audit_logs_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_audit_logs_created_at ON public.catalog_audit_logs USING btree (created_at);


--
-- Name: idx_audit_logs_record_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_audit_logs_record_id ON public.catalog_audit_logs USING btree (record_id);


--
-- Name: idx_audit_logs_table_name; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_audit_logs_table_name ON public.catalog_audit_logs USING btree (table_name);


--
-- Name: idx_audit_logs_table_record; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_audit_logs_table_record ON public.catalog_audit_logs USING btree (table_name, record_id);


--
-- Name: idx_booking_types_description_uq; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX idx_booking_types_description_uq ON public.booking_types USING btree (description) WHERE (deleted_at IS NULL);


--
-- Name: idx_cinemas_name_uq; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX idx_cinemas_name_uq ON public.cinemas USING btree (name) WHERE (deleted_at IS NULL);


--
-- Name: idx_combo_products_uq; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX idx_combo_products_uq ON public.combo_products USING btree (combo, product) WHERE (deleted_at IS NULL);


--
-- Name: idx_combos_name_uq; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX idx_combos_name_uq ON public.combos USING btree (cinema, name) WHERE (deleted_at IS NULL);


--
-- Name: idx_combos_sku_uq; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX idx_combos_sku_uq ON public.combos USING btree (sku) WHERE (deleted_at IS NULL);


--
-- Name: idx_currencies_code_uq; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX idx_currencies_code_uq ON public.currencies USING btree (code) WHERE (deleted_at IS NULL);


--
-- Name: idx_customers_people_uq; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX idx_customers_people_uq ON public.customers USING btree (person) WHERE (deleted_at IS NULL);


--
-- Name: idx_employee_positions_active_uq; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX idx_employee_positions_active_uq ON public.employee_positions USING btree (employee) WHERE ((deleted_at IS NULL) AND (end_date IS NULL));


--
-- Name: idx_employees_code_uq; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX idx_employees_code_uq ON public.employees USING btree (employee_code) WHERE (deleted_at IS NULL);


--
-- Name: idx_employees_people_uq; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX idx_employees_people_uq ON public.employees USING btree (person) WHERE (deleted_at IS NULL);


--
-- Name: idx_exchange_rates_currency_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_exchange_rates_currency_date ON public.exchange_rates USING btree (currency, created_at);


--
-- Name: idx_genders_description_uq; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX idx_genders_description_uq ON public.genders USING btree (description) WHERE (deleted_at IS NULL);


--
-- Name: idx_genres_description_uq; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX idx_genres_description_uq ON public.genres USING btree (description) WHERE (deleted_at IS NULL);


--
-- Name: idx_inv_mov_calc; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_inv_mov_calc ON public.inventory_movements USING btree (inventory, operation_type);


--
-- Name: idx_inventories_cinema_product_uq; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX idx_inventories_cinema_product_uq ON public.inventories USING btree (cinema, product) WHERE (deleted_at IS NULL);


--
-- Name: idx_invoice_sequences_cinema_uq; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX idx_invoice_sequences_cinema_uq ON public.invoice_sequences USING btree (cinema) WHERE (deleted_at IS NULL);


--
-- Name: idx_invoice_sequences_prefix_uq; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX idx_invoice_sequences_prefix_uq ON public.invoice_sequences USING btree (prefix) WHERE (deleted_at IS NULL);


--
-- Name: idx_invoices_billing_document; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_invoices_billing_document ON public.invoices USING btree (billing_document);


--
-- Name: idx_invoices_issued_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_invoices_issued_at ON public.invoices USING btree (issued_at);


--
-- Name: idx_invoices_number_uq; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX idx_invoices_number_uq ON public.invoices USING btree (invoice_number) WHERE (deleted_at IS NULL);


--
-- Name: idx_invoices_order; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_invoices_order ON public.invoices USING btree ("order");


--
-- Name: idx_job_positions_title_uq; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX idx_job_positions_title_uq ON public.job_positions USING btree (title) WHERE (deleted_at IS NULL);


--
-- Name: idx_line_types_uq; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX idx_line_types_uq ON public.line_types USING btree (description) WHERE (deleted_at IS NULL);


--
-- Name: idx_loyalty_customer_op; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_loyalty_customer_op ON public.loyalty_ledgers USING btree (customer, operation_type);


--
-- Name: idx_loyalty_levels_name_uq; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX idx_loyalty_levels_name_uq ON public.loyalty_levels USING btree (name) WHERE (deleted_at IS NULL);


--
-- Name: idx_modifier_scopes_description_uq; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX idx_modifier_scopes_description_uq ON public.modifier_scopes USING btree (description) WHERE (deleted_at IS NULL);


--
-- Name: idx_movie_genres_uq; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX idx_movie_genres_uq ON public.movie_genres USING btree (movie, genre) WHERE (deleted_at IS NULL);


--
-- Name: idx_movie_lifecycle_states_description_uq; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX idx_movie_lifecycle_states_description_uq ON public.movie_lifecycle_states USING btree (description) WHERE (deleted_at IS NULL);


--
-- Name: idx_movie_subscriptions_uq; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX idx_movie_subscriptions_uq ON public.movie_subscriptions USING btree (customer, movie) WHERE (deleted_at IS NULL);


--
-- Name: idx_movies_title_uq; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX idx_movies_title_uq ON public.movies USING btree (title) WHERE (deleted_at IS NULL);


--
-- Name: idx_operation_types_description_uq; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX idx_operation_types_description_uq ON public.operation_types USING btree (description) WHERE (deleted_at IS NULL);


--
-- Name: idx_order_lines_order; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_order_lines_order ON public.order_lines USING btree ("order");


--
-- Name: idx_order_payments_order; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_order_payments_order ON public.order_payments USING btree ("order");


--
-- Name: idx_order_payments_ref_uq; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX idx_order_payments_ref_uq ON public.order_payments USING btree (payment_method, reference_number) WHERE (deleted_at IS NULL);


--
-- Name: idx_order_statuses_uq; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX idx_order_statuses_uq ON public.order_statuses USING btree (description) WHERE (deleted_at IS NULL);


--
-- Name: idx_order_taxes_order; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_order_taxes_order ON public.order_taxes USING btree ("order");


--
-- Name: idx_orders_cinema_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_orders_cinema_date ON public.orders USING btree (cinema, created_at);


--
-- Name: idx_orders_customer; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_orders_customer ON public.orders USING btree (customer);


--
-- Name: idx_payment_methods_uq; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX idx_payment_methods_uq ON public.payment_methods USING btree (description) WHERE (deleted_at IS NULL);


--
-- Name: idx_payments_method_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_payments_method_date ON public.order_payments USING btree (payment_method, created_at);


--
-- Name: idx_people_document_number_uq; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX idx_people_document_number_uq ON public.people USING btree (document_number) WHERE (deleted_at IS NULL);


--
-- Name: idx_permission_types_code_uq; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX idx_permission_types_code_uq ON public.permission_types USING btree (code) WHERE (deleted_at IS NULL);


--
-- Name: idx_permissions_uq; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX idx_permissions_uq ON public.permissions USING btree (action, resource, permission_type) WHERE (deleted_at IS NULL);


--
-- Name: idx_price_modifiers_cinema; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_price_modifiers_cinema ON public.price_modifiers USING btree (cinema);


--
-- Name: idx_price_modifiers_dates; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_price_modifiers_dates ON public.price_modifiers USING btree (start_date, end_date);


--
-- Name: idx_price_modifiers_scope; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_price_modifiers_scope ON public.price_modifiers USING btree (modifier_scope);


--
-- Name: idx_product_categories_name_uq; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX idx_product_categories_name_uq ON public.product_categories USING btree (description) WHERE (deleted_at IS NULL);


--
-- Name: idx_products_sku_uq; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX idx_products_sku_uq ON public.products USING btree (sku) WHERE (deleted_at IS NULL);


--
-- Name: idx_projection_types_description_uq; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX idx_projection_types_description_uq ON public.projection_types USING btree (description) WHERE (deleted_at IS NULL);


--
-- Name: idx_rentals_customer_time; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_rentals_customer_time ON public.rental_requests USING btree (customer, requested_start_time);


--
-- Name: idx_resources_code_uq; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX idx_resources_code_uq ON public.resources USING btree (code) WHERE (deleted_at IS NULL);


--
-- Name: idx_role_inheritances_uq; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX idx_role_inheritances_uq ON public.role_inheritances USING btree (parent_role, child_role) WHERE (deleted_at IS NULL);


--
-- Name: idx_role_permissions_uq; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX idx_role_permissions_uq ON public.role_permissions USING btree (role, permission) WHERE (deleted_at IS NULL);


--
-- Name: idx_roles_code_uq; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX idx_roles_code_uq ON public.roles USING btree (code) WHERE (deleted_at IS NULL);


--
-- Name: idx_roles_name_uq; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX idx_roles_name_uq ON public.roles USING btree (name) WHERE (deleted_at IS NULL);


--
-- Name: idx_room_bookings_room_time; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_room_bookings_room_time ON public.room_bookings USING btree (room, start_time);


--
-- Name: idx_room_events_booking_uq; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX idx_room_events_booking_uq ON public.room_events USING btree (booking) WHERE (deleted_at IS NULL);


--
-- Name: idx_room_projection_types_uq; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX idx_room_projection_types_uq ON public.room_projection_types USING btree (room, projection_type) WHERE (deleted_at IS NULL);


--
-- Name: idx_rooms_cinema_name_uq; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX idx_rooms_cinema_name_uq ON public.rooms USING btree (cinema, name) WHERE (deleted_at IS NULL);


--
-- Name: idx_seat_categories_description_uq; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX idx_seat_categories_description_uq ON public.seat_categories USING btree (description) WHERE (deleted_at IS NULL);


--
-- Name: idx_seat_conditions_description_uq; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX idx_seat_conditions_description_uq ON public.seat_conditions USING btree (description) WHERE (deleted_at IS NULL);


--
-- Name: idx_seats_room_row_col_uq; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX idx_seats_room_row_col_uq ON public.seats USING btree (room, row_identifier, column_number) WHERE (deleted_at IS NULL);


--
-- Name: idx_showtimes_booking_uq; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX idx_showtimes_booking_uq ON public.showtimes USING btree (booking) WHERE (deleted_at IS NULL);


--
-- Name: idx_showtimes_movie; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_showtimes_movie ON public.showtimes USING btree (movie);


--
-- Name: idx_tax_rules_cinema; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_tax_rules_cinema ON public.tax_rules USING btree (cinema);


--
-- Name: idx_tax_rules_scope; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_tax_rules_scope ON public.tax_rules USING btree (tax_scope);


--
-- Name: idx_taxes_name_uq; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX idx_taxes_name_uq ON public.taxes USING btree (name) WHERE (deleted_at IS NULL);


--
-- Name: idx_tickets_order; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_tickets_order ON public.tickets USING btree ("order");


--
-- Name: idx_tickets_qr_code_uq; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX idx_tickets_qr_code_uq ON public.tickets USING btree (qr_code) WHERE (deleted_at IS NULL);


--
-- Name: idx_tickets_showtime_seat_uq; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX idx_tickets_showtime_seat_uq ON public.tickets USING btree (showtime, seat) WHERE (deleted_at IS NULL);


--
-- Name: idx_user_permissions_uq; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX idx_user_permissions_uq ON public.user_permissions USING btree ("user", permission) WHERE (deleted_at IS NULL);


--
-- Name: idx_user_types_description_uq; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX idx_user_types_description_uq ON public.user_types USING btree (description) WHERE (deleted_at IS NULL);


--
-- Name: idx_users_email_uq; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX idx_users_email_uq ON public.users USING btree (email) WHERE (deleted_at IS NULL);


--
-- Name: idx_users_logins_jti_uq; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX idx_users_logins_jti_uq ON public.users_logins USING btree (jti) WHERE (deleted_at IS NULL);


--
-- Name: idx_users_logins_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_users_logins_user ON public.users_logins USING btree ("user");


--
-- Name: idx_week_days_day_number_uq; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX idx_week_days_day_number_uq ON public.week_days USING btree (day_number) WHERE (deleted_at IS NULL);


--
-- Name: combo_products fk_combo_products_combo; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.combo_products
    ADD CONSTRAINT fk_combo_products_combo FOREIGN KEY (combo) REFERENCES public.combos(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: combo_products fk_combo_products_product; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.combo_products
    ADD CONSTRAINT fk_combo_products_product FOREIGN KEY (product) REFERENCES public.products(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: combos fk_combos_cinema; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.combos
    ADD CONSTRAINT fk_combos_cinema FOREIGN KEY (cinema) REFERENCES public.cinemas(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: combos fk_combos_currency; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.combos
    ADD CONSTRAINT fk_combos_currency FOREIGN KEY (currency) REFERENCES public.currencies(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: customers fk_customers_loyalty_level; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.customers
    ADD CONSTRAINT fk_customers_loyalty_level FOREIGN KEY (loyalty_level) REFERENCES public.loyalty_levels(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: customers fk_customers_people; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.customers
    ADD CONSTRAINT fk_customers_people FOREIGN KEY (person) REFERENCES public.people(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: employee_positions fk_employee_positions_cinema; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employee_positions
    ADD CONSTRAINT fk_employee_positions_cinema FOREIGN KEY (cinema) REFERENCES public.cinemas(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: employee_positions fk_employee_positions_employee; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employee_positions
    ADD CONSTRAINT fk_employee_positions_employee FOREIGN KEY (employee) REFERENCES public.employees(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: employee_positions fk_employee_positions_job_position; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employee_positions
    ADD CONSTRAINT fk_employee_positions_job_position FOREIGN KEY (job_position) REFERENCES public.job_positions(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: employees fk_employees_people; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employees
    ADD CONSTRAINT fk_employees_people FOREIGN KEY (person) REFERENCES public.people(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: exchange_rates fk_exchange_rates_currency; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.exchange_rates
    ADD CONSTRAINT fk_exchange_rates_currency FOREIGN KEY (currency) REFERENCES public.currencies(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: exchange_rates fk_exchange_rates_user; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.exchange_rates
    ADD CONSTRAINT fk_exchange_rates_user FOREIGN KEY ("user") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: inventories fk_inventories_cinema; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inventories
    ADD CONSTRAINT fk_inventories_cinema FOREIGN KEY (cinema) REFERENCES public.cinemas(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: inventories fk_inventories_product; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inventories
    ADD CONSTRAINT fk_inventories_product FOREIGN KEY (product) REFERENCES public.products(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: inventory_movements fk_inventory_movements_currency; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inventory_movements
    ADD CONSTRAINT fk_inventory_movements_currency FOREIGN KEY (currency) REFERENCES public.currencies(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: inventory_movements fk_inventory_movements_inventory; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inventory_movements
    ADD CONSTRAINT fk_inventory_movements_inventory FOREIGN KEY (inventory) REFERENCES public.inventories(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: inventory_movements fk_inventory_movements_operation_type; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inventory_movements
    ADD CONSTRAINT fk_inventory_movements_operation_type FOREIGN KEY (operation_type) REFERENCES public.operation_types(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: inventory_movements fk_inventory_movements_user; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inventory_movements
    ADD CONSTRAINT fk_inventory_movements_user FOREIGN KEY ("user") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: invoice_sequences fk_invoice_sequences_cinema; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.invoice_sequences
    ADD CONSTRAINT fk_invoice_sequences_cinema FOREIGN KEY (cinema) REFERENCES public.cinemas(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: invoices fk_invoices_order; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT fk_invoices_order FOREIGN KEY ("order") REFERENCES public.orders(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: loyalty_ledgers fk_loyalty_ledgers_customer; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.loyalty_ledgers
    ADD CONSTRAINT fk_loyalty_ledgers_customer FOREIGN KEY (customer) REFERENCES public.customers(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: loyalty_ledgers fk_loyalty_ledgers_operation_type; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.loyalty_ledgers
    ADD CONSTRAINT fk_loyalty_ledgers_operation_type FOREIGN KEY (operation_type) REFERENCES public.operation_types(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: loyalty_ledgers fk_loyalty_ledgers_order; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.loyalty_ledgers
    ADD CONSTRAINT fk_loyalty_ledgers_order FOREIGN KEY ("order") REFERENCES public.orders(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: movie_genres fk_movie_genres_genre; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.movie_genres
    ADD CONSTRAINT fk_movie_genres_genre FOREIGN KEY (genre) REFERENCES public.genres(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: movie_genres fk_movie_genres_movie; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.movie_genres
    ADD CONSTRAINT fk_movie_genres_movie FOREIGN KEY (movie) REFERENCES public.movies(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: movie_subscriptions fk_movie_subscriptions_customer; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.movie_subscriptions
    ADD CONSTRAINT fk_movie_subscriptions_customer FOREIGN KEY (customer) REFERENCES public.customers(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: movie_subscriptions fk_movie_subscriptions_movie; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.movie_subscriptions
    ADD CONSTRAINT fk_movie_subscriptions_movie FOREIGN KEY (movie) REFERENCES public.movies(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: movies fk_movies_age_classification; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.movies
    ADD CONSTRAINT fk_movies_age_classification FOREIGN KEY (age_classification) REFERENCES public.age_classifications(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: movies fk_movies_lifecycle_state; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.movies
    ADD CONSTRAINT fk_movies_lifecycle_state FOREIGN KEY (lifecycle_state) REFERENCES public.movie_lifecycle_states(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: order_lines fk_order_lines_combo; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_lines
    ADD CONSTRAINT fk_order_lines_combo FOREIGN KEY (combo) REFERENCES public.combos(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: order_lines fk_order_lines_line_type; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_lines
    ADD CONSTRAINT fk_order_lines_line_type FOREIGN KEY (line_type) REFERENCES public.line_types(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: order_lines fk_order_lines_order; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_lines
    ADD CONSTRAINT fk_order_lines_order FOREIGN KEY ("order") REFERENCES public.orders(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: order_lines fk_order_lines_price_modifier; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_lines
    ADD CONSTRAINT fk_order_lines_price_modifier FOREIGN KEY (price_modifier) REFERENCES public.price_modifiers(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: order_lines fk_order_lines_product; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_lines
    ADD CONSTRAINT fk_order_lines_product FOREIGN KEY (product) REFERENCES public.products(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: order_lines fk_order_lines_quoted_exchange_rate; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_lines
    ADD CONSTRAINT fk_order_lines_quoted_exchange_rate FOREIGN KEY (quoted_exchange_rate) REFERENCES public.exchange_rates(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: order_payments fk_order_payments_order; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_payments
    ADD CONSTRAINT fk_order_payments_order FOREIGN KEY ("order") REFERENCES public.orders(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: order_payments fk_order_payments_payment_method; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_payments
    ADD CONSTRAINT fk_order_payments_payment_method FOREIGN KEY (payment_method) REFERENCES public.payment_methods(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: order_payments fk_order_payments_quoted_exchange_rate; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_payments
    ADD CONSTRAINT fk_order_payments_quoted_exchange_rate FOREIGN KEY (quoted_exchange_rate) REFERENCES public.exchange_rates(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: order_taxes fk_order_taxes_order; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_taxes
    ADD CONSTRAINT fk_order_taxes_order FOREIGN KEY ("order") REFERENCES public.orders(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: order_taxes fk_order_taxes_tax; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_taxes
    ADD CONSTRAINT fk_order_taxes_tax FOREIGN KEY (tax) REFERENCES public.taxes(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: orders fk_orders_cinema; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT fk_orders_cinema FOREIGN KEY (cinema) REFERENCES public.cinemas(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: orders fk_orders_customer; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT fk_orders_customer FOREIGN KEY (customer) REFERENCES public.customers(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: orders fk_orders_employee; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT fk_orders_employee FOREIGN KEY (employee) REFERENCES public.employees(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: orders fk_orders_order_status; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT fk_orders_order_status FOREIGN KEY (order_status) REFERENCES public.order_statuses(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: orders fk_orders_system_base_currency; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT fk_orders_system_base_currency FOREIGN KEY (system_base_currency) REFERENCES public.currencies(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: people fk_people_gender; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.people
    ADD CONSTRAINT fk_people_gender FOREIGN KEY (gender) REFERENCES public.genders(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: permissions fk_permissions_action; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.permissions
    ADD CONSTRAINT fk_permissions_action FOREIGN KEY (action) REFERENCES public.actions(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: permissions fk_permissions_permission_type; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.permissions
    ADD CONSTRAINT fk_permissions_permission_type FOREIGN KEY (permission_type) REFERENCES public.permission_types(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: permissions fk_permissions_resource; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.permissions
    ADD CONSTRAINT fk_permissions_resource FOREIGN KEY (resource) REFERENCES public.resources(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: price_modifiers fk_price_modifiers_audience_category; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.price_modifiers
    ADD CONSTRAINT fk_price_modifiers_audience_category FOREIGN KEY (audience_category) REFERENCES public.audience_categories(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: price_modifiers fk_price_modifiers_cinema; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.price_modifiers
    ADD CONSTRAINT fk_price_modifiers_cinema FOREIGN KEY (cinema) REFERENCES public.cinemas(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: price_modifiers fk_price_modifiers_combo; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.price_modifiers
    ADD CONSTRAINT fk_price_modifiers_combo FOREIGN KEY (combo) REFERENCES public.combos(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: price_modifiers fk_price_modifiers_currency; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.price_modifiers
    ADD CONSTRAINT fk_price_modifiers_currency FOREIGN KEY (currency) REFERENCES public.currencies(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: price_modifiers fk_price_modifiers_line_type; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.price_modifiers
    ADD CONSTRAINT fk_price_modifiers_line_type FOREIGN KEY (line_type) REFERENCES public.line_types(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: price_modifiers fk_price_modifiers_modifier_scope; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.price_modifiers
    ADD CONSTRAINT fk_price_modifiers_modifier_scope FOREIGN KEY (modifier_scope) REFERENCES public.modifier_scopes(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: price_modifiers fk_price_modifiers_operation_type; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.price_modifiers
    ADD CONSTRAINT fk_price_modifiers_operation_type FOREIGN KEY (operation_type) REFERENCES public.operation_types(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: price_modifiers fk_price_modifiers_product; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.price_modifiers
    ADD CONSTRAINT fk_price_modifiers_product FOREIGN KEY (product) REFERENCES public.products(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: price_modifiers fk_price_modifiers_product_category; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.price_modifiers
    ADD CONSTRAINT fk_price_modifiers_product_category FOREIGN KEY (product_category) REFERENCES public.product_categories(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: price_modifiers fk_price_modifiers_projection_type; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.price_modifiers
    ADD CONSTRAINT fk_price_modifiers_projection_type FOREIGN KEY (projection_type) REFERENCES public.projection_types(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: price_modifiers fk_price_modifiers_seat_category; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.price_modifiers
    ADD CONSTRAINT fk_price_modifiers_seat_category FOREIGN KEY (seat_category) REFERENCES public.seat_categories(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: price_modifiers fk_price_modifiers_target_currency; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.price_modifiers
    ADD CONSTRAINT fk_price_modifiers_target_currency FOREIGN KEY (target_currency) REFERENCES public.currencies(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: price_modifiers fk_price_modifiers_week_day; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.price_modifiers
    ADD CONSTRAINT fk_price_modifiers_week_day FOREIGN KEY (week_day) REFERENCES public.week_days(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: products fk_products_currency; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT fk_products_currency FOREIGN KEY (currency) REFERENCES public.currencies(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: products fk_products_product_category; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT fk_products_product_category FOREIGN KEY (product_category) REFERENCES public.product_categories(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: rental_requests fk_rental_requests_booking; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rental_requests
    ADD CONSTRAINT fk_rental_requests_booking FOREIGN KEY (booking) REFERENCES public.room_bookings(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: rental_requests fk_rental_requests_currency; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rental_requests
    ADD CONSTRAINT fk_rental_requests_currency FOREIGN KEY (currency) REFERENCES public.currencies(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: rental_requests fk_rental_requests_customer; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rental_requests
    ADD CONSTRAINT fk_rental_requests_customer FOREIGN KEY (customer) REFERENCES public.customers(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: rental_requests fk_rental_requests_event_type; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rental_requests
    ADD CONSTRAINT fk_rental_requests_event_type FOREIGN KEY (event_type) REFERENCES public.booking_types(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: rental_requests fk_rental_requests_room; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rental_requests
    ADD CONSTRAINT fk_rental_requests_room FOREIGN KEY (room) REFERENCES public.rooms(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: role_inheritances fk_role_inheritances_child_role; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.role_inheritances
    ADD CONSTRAINT fk_role_inheritances_child_role FOREIGN KEY (child_role) REFERENCES public.roles(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: role_inheritances fk_role_inheritances_parent_role; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.role_inheritances
    ADD CONSTRAINT fk_role_inheritances_parent_role FOREIGN KEY (parent_role) REFERENCES public.roles(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: role_permissions fk_role_permissions_permission; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT fk_role_permissions_permission FOREIGN KEY (permission) REFERENCES public.permissions(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: role_permissions fk_role_permissions_role; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT fk_role_permissions_role FOREIGN KEY (role) REFERENCES public.roles(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: room_bookings fk_room_bookings_booking_type; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.room_bookings
    ADD CONSTRAINT fk_room_bookings_booking_type FOREIGN KEY (booking_type) REFERENCES public.booking_types(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: room_bookings fk_room_bookings_room; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.room_bookings
    ADD CONSTRAINT fk_room_bookings_room FOREIGN KEY (room) REFERENCES public.rooms(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: room_events fk_room_events_booking; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.room_events
    ADD CONSTRAINT fk_room_events_booking FOREIGN KEY (booking) REFERENCES public.room_bookings(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: room_events fk_room_events_currency; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.room_events
    ADD CONSTRAINT fk_room_events_currency FOREIGN KEY (currency) REFERENCES public.currencies(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: room_events fk_room_events_event_type; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.room_events
    ADD CONSTRAINT fk_room_events_event_type FOREIGN KEY (event_type) REFERENCES public.booking_types(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: room_projection_types fk_room_projection_types_projection_type; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.room_projection_types
    ADD CONSTRAINT fk_room_projection_types_projection_type FOREIGN KEY (projection_type) REFERENCES public.projection_types(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: room_projection_types fk_room_projection_types_room; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.room_projection_types
    ADD CONSTRAINT fk_room_projection_types_room FOREIGN KEY (room) REFERENCES public.rooms(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: rooms fk_rooms_cinema; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rooms
    ADD CONSTRAINT fk_rooms_cinema FOREIGN KEY (cinema) REFERENCES public.cinemas(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: seats fk_seats_room; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.seats
    ADD CONSTRAINT fk_seats_room FOREIGN KEY (room) REFERENCES public.rooms(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: seats fk_seats_seat_category; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.seats
    ADD CONSTRAINT fk_seats_seat_category FOREIGN KEY (seat_category) REFERENCES public.seat_categories(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: seats fk_seats_seat_condition; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.seats
    ADD CONSTRAINT fk_seats_seat_condition FOREIGN KEY (seat_condition) REFERENCES public.seat_conditions(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: showtimes fk_showtimes_booking; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.showtimes
    ADD CONSTRAINT fk_showtimes_booking FOREIGN KEY (booking) REFERENCES public.room_bookings(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: showtimes fk_showtimes_currency; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.showtimes
    ADD CONSTRAINT fk_showtimes_currency FOREIGN KEY (currency) REFERENCES public.currencies(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: showtimes fk_showtimes_movie; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.showtimes
    ADD CONSTRAINT fk_showtimes_movie FOREIGN KEY (movie) REFERENCES public.movies(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: showtimes fk_showtimes_projection_type; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.showtimes
    ADD CONSTRAINT fk_showtimes_projection_type FOREIGN KEY (projection_type) REFERENCES public.projection_types(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: tax_rules fk_tax_rules_cinema; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tax_rules
    ADD CONSTRAINT fk_tax_rules_cinema FOREIGN KEY (cinema) REFERENCES public.cinemas(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: tax_rules fk_tax_rules_combo; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tax_rules
    ADD CONSTRAINT fk_tax_rules_combo FOREIGN KEY (combo) REFERENCES public.combos(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: tax_rules fk_tax_rules_line_type; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tax_rules
    ADD CONSTRAINT fk_tax_rules_line_type FOREIGN KEY (line_type) REFERENCES public.line_types(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: tax_rules fk_tax_rules_product; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tax_rules
    ADD CONSTRAINT fk_tax_rules_product FOREIGN KEY (product) REFERENCES public.products(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: tax_rules fk_tax_rules_product_category; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tax_rules
    ADD CONSTRAINT fk_tax_rules_product_category FOREIGN KEY (product_category) REFERENCES public.product_categories(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: tax_rules fk_tax_rules_tax; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tax_rules
    ADD CONSTRAINT fk_tax_rules_tax FOREIGN KEY (tax) REFERENCES public.taxes(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: tickets fk_tickets_order; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tickets
    ADD CONSTRAINT fk_tickets_order FOREIGN KEY ("order") REFERENCES public.orders(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: tickets fk_tickets_price_modifier; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tickets
    ADD CONSTRAINT fk_tickets_price_modifier FOREIGN KEY (price_modifier) REFERENCES public.price_modifiers(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: tickets fk_tickets_quoted_exchange_rate; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tickets
    ADD CONSTRAINT fk_tickets_quoted_exchange_rate FOREIGN KEY (quoted_exchange_rate) REFERENCES public.exchange_rates(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: tickets fk_tickets_seat; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tickets
    ADD CONSTRAINT fk_tickets_seat FOREIGN KEY (seat) REFERENCES public.seats(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: tickets fk_tickets_showtime; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tickets
    ADD CONSTRAINT fk_tickets_showtime FOREIGN KEY (showtime) REFERENCES public.showtimes(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: user_permissions fk_user_permissions_permission; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_permissions
    ADD CONSTRAINT fk_user_permissions_permission FOREIGN KEY (permission) REFERENCES public.permissions(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: user_permissions fk_user_permissions_user; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_permissions
    ADD CONSTRAINT fk_user_permissions_user FOREIGN KEY ("user") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: users_logins fk_users_logins_user; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users_logins
    ADD CONSTRAINT fk_users_logins_user FOREIGN KEY ("user") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: users fk_users_people; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT fk_users_people FOREIGN KEY (person) REFERENCES public.people(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: users fk_users_role; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT fk_users_role FOREIGN KEY (role) REFERENCES public.roles(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: users fk_users_user_type; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT fk_users_user_type FOREIGN KEY (user_type) REFERENCES public.user_types(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- PostgreSQL database dump complete
--

\unrestrict j5Nl1ATvzTVThuepxCgGVYkEs4dRjppI8iQqJmIO3Q8Cbeg5bcYzMxSiV252d5R

