'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
	async up(queryInterface, Sequelize) {
		await queryInterface.sequelize.transaction(async (transaction) => {
			await queryInterface.addColumn(
				'movies',
				'lifecycle_state_changed_at',
				{
					type: Sequelize.DATE,
					allowNull: true,
				},
				{ transaction },
			);
		});
	},

	async down(queryInterface) {
		await queryInterface.removeColumn('movies', 'lifecycle_state_changed_at');
	},
};
