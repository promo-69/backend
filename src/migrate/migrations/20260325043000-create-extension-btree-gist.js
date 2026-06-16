'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
	async up(queryInterface, Sequelize) {
		await queryInterface.sequelize.query('CREATE EXTENSION IF NOT EXISTS btree_gist;');
	},

	async down(queryInterface, Sequelize) {
		await queryInterface.sequelize.query('DROP EXTENSION IF EXISTS btree_gist;');
	}
};
