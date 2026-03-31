'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        // ==============================================================================
        // PROCEDIMIENTO: UPDATE SERIAL SEQUENCE
        // ==============================================================================
        await queryInterface.sequelize.query(`
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
        `);
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.sequelize
            .query(`DROP PROCEDURE IF EXISTS public.update_serial_sequence(text, text);`)
            .catch(() => {});
    },
};
