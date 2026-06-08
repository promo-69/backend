'use strict';

/**
 * @type {import('sequelize-cli').Migration}
 */
module.exports = {
    async up(queryInterface) {
        await queryInterface.sequelize.query(`
			ALTER TABLE showtimes ALTER COLUMN movie DROP NOT NULL;
		`);
    },

    async down(queryInterface) {
        await queryInterface.sequelize.query(`
			ALTER TABLE showtimes ALTER COLUMN movie SET NOT NULL;
		`);
    },
};
