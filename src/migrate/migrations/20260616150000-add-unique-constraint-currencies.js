'use strict';

/**
 * Agrega un índice único parcial a la tabla currencies
 * para asegurar a nivel de base de datos que solo exista
 * una moneda base en el sistema a la vez.
 *
 * @type {import('sequelize-cli').Migration}
 */
module.exports = {
    async up(queryInterface) {
        await queryInterface.sequelize.query(`
            CREATE UNIQUE INDEX unique_base_currency ON currencies (is_base_currency) WHERE is_base_currency = true;
        `);
    },

    async down(queryInterface) {
        await queryInterface.sequelize.query(`
            DROP INDEX IF EXISTS unique_base_currency;
        `);
    },
};
