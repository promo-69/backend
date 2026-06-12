'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.sequelize.transaction(async (transaction) => {
            // ── 1. Catálogo de estados ─────────────────────────────────────
            await queryInterface.createTable(
                'rental_request_statuses',
                {
                    id: {
                        type: Sequelize.INTEGER,
                        primaryKey: true,
                        autoIncrement: true,
                        allowNull: false,
                    },
                    description: {
                        type: Sequelize.STRING(100),
                        allowNull: false,
                    },
                    deleted_at: {
                        type: Sequelize.DATE,
                        allowNull: true,
                    },
                },
                { transaction },
            );

            // ── 2. Fecha del evento ────────────────────────────────────────
            await queryInterface.addColumn(
                'rental_requests',
                'event_date',
                {
                    type: Sequelize.DATEONLY,
                    allowNull: false,
                    // defaultValue temporal necesario al agregar NOT NULL a tabla existente;
                    // se quita inmediatamente después para que las nuevas filas lo requieran.
                    defaultValue: Sequelize.literal('CURRENT_DATE'),
                },
                { transaction },
            );
            await queryInterface.sequelize.query(`ALTER TABLE rental_requests ALTER COLUMN event_date DROP DEFAULT;`, {
                transaction,
            });

            // ── 3. Aforo estimado ──────────────────────────────────────────
            await queryInterface.addColumn(
                'rental_requests',
                'attendees',
                {
                    type: Sequelize.INTEGER,
                    allowNull: true,
                },
                { transaction },
            );

            // ── 4. FK status → rental_request_statuses ────────────────────
            await queryInterface.addConstraint('rental_requests', {
                fields: ['status'],
                type: 'foreign key',
                name: 'fk_rental_requests_status',
                references: { table: 'rental_request_statuses', field: 'id' },
                transaction,
            });
        });
    },

    async down(queryInterface) {
        await queryInterface.sequelize.transaction(async (transaction) => {
            await queryInterface.removeConstraint('rental_requests', 'fk_rental_requests_status', { transaction });
            await queryInterface.removeColumn('rental_requests', 'attendees', { transaction });
            await queryInterface.removeColumn('rental_requests', 'event_date', { transaction });
            await queryInterface.dropTable('rental_request_statuses', { transaction });
        });
    },
};
