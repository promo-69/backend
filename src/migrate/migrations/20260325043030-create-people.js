'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
	async up(queryInterface, Sequelize) {
		await queryInterface.sequelize.transaction(async (transaction) => {
			await queryInterface.createTable('people', { id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false }, document_number: { type: Sequelize.STRING(50), allowNull: false }, first_name: { type: Sequelize.STRING(255), allowNull: false }, last_name: { type: Sequelize.STRING(255), allowNull: false }, gender: { type: Sequelize.INTEGER, allowNull: true }, phone_number: { type: Sequelize.STRING(50), allowNull: true }, personal_email: { type: Sequelize.STRING(100), allowNull: true }, birth_date: { type: Sequelize.DATEONLY, allowNull: true }, created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }, updated_at: { type: Sequelize.DATE, allowNull: true }, deleted_at: { type: Sequelize.DATE, allowNull: true } }, { transaction });
			await queryInterface.addIndex('people', ['document_number'], { unique: true, name: 'idx_people_document_number_uq', where: { deleted_at: null } , transaction });
			await queryInterface.addConstraint('people', { fields: ['gender'], type: 'foreign key', name: 'fk_people_gender', references: { table: 'genders', field: 'id' }, onDelete: 'RESTRICT', onUpdate: 'CASCADE' , transaction });
		});
	},

	async down(queryInterface, Sequelize) {
		await queryInterface.dropTable('people');
	}
};
