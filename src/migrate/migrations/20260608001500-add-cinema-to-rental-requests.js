'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.sequelize.transaction(async (transaction) => {
            // 1. Agregar columna cinema (nullable inicialmente)
            await queryInterface.addColumn(
                'rental_requests',
                'cinema',
                {
                    type: Sequelize.INTEGER,
                    allowNull: true,
                    references: { model: 'cinemas', key: 'id' },
                },
                { transaction },
            );

            // 2. Actualizar registros existentes: asignar cinema según la sala
            await queryInterface.sequelize.query(
                `
                UPDATE rental_requests rr
                SET cinema = (
                    SELECT r.cinema
                    FROM rooms r
                    WHERE r.id = rr.room AND r.deleted_at IS NULL
                )
                WHERE rr.cinema IS NULL;
            `,
                { transaction },
            );

            // 3. Verificar que no queden registros con cinema NULL
            const [result] = await queryInterface.sequelize.query(
                `
                SELECT COUNT(*) as count
                FROM rental_requests
                WHERE cinema IS NULL AND deleted_at IS NULL;
            `,
                { transaction },
            );

            if (result[0].count > 0) {
                console.warn(`${result[0].count} solicitudes no tienen cine asignado. Verifica las salas.`);
            }

            // 4. Hacer la columna NOT NULL después de actualizar
            await queryInterface.changeColumn(
                'rental_requests',
                'cinema',
                {
                    type: Sequelize.INTEGER,
                    allowNull: false,
                    references: { model: 'cinemas', key: 'id' },
                },
                { transaction },
            );

            // 5. Agregar índice para búsquedas por cine
            await queryInterface.addIndex('rental_requests', ['cinema'], {
                name: 'idx_rental_requests_cinema',
                transaction,
            });

            // 6. Agregar índice compuesto para filtros comunes (cinema + status + fecha)
            await queryInterface.addIndex('rental_requests', ['cinema', 'status', 'requested_start_time'], {
                name: 'idx_rental_requests_cinema_status_date',
                transaction,
            });
        });
    },

    async down(queryInterface) {
        await queryInterface.sequelize.transaction(async (transaction) => {
            await queryInterface.removeIndex('rental_requests', 'idx_rental_requests_cinema_status_date', {
                transaction,
            });
            await queryInterface.removeIndex('rental_requests', 'idx_rental_requests_cinema', { transaction });
            await queryInterface.removeColumn('rental_requests', 'cinema', { transaction });
        });
    },
};
