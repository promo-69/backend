'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
	async up(queryInterface, Sequelize) {
		await queryInterface.sequelize.transaction(async (transaction) => {
			await queryInterface.createTable('bank_accounts', {
				id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
				bank: { type: Sequelize.INTEGER, allowNull: false },
				currency: { type: Sequelize.INTEGER, allowNull: false },
				payment_method: { type: Sequelize.INTEGER, allowNull: false },
				payment_details: { type: Sequelize.JSONB, allowNull: false },
				deleted_at: { type: Sequelize.DATE, allowNull: true }
			}, { transaction });

			await queryInterface.addIndex('bank_accounts', ['bank', 'currency', 'payment_method'], { unique: true, name: 'idx_bank_accounts_uq', where: { deleted_at: null }, transaction });
			
			await queryInterface.addConstraint('bank_accounts', { fields: ['bank'], type: 'foreign key', name: 'fk_bank_accounts_bank', references: { table: 'banks', field: 'id' }, onDelete: 'RESTRICT', onUpdate: 'CASCADE', transaction });
			await queryInterface.addConstraint('bank_accounts', { fields: ['currency'], type: 'foreign key', name: 'fk_bank_accounts_currency', references: { table: 'currencies', field: 'id' }, onDelete: 'RESTRICT', onUpdate: 'CASCADE', transaction });
			await queryInterface.addConstraint('bank_accounts', { fields: ['payment_method'], type: 'foreign key', name: 'fk_bank_accounts_payment_method', references: { table: 'payment_methods', field: 'id' }, onDelete: 'RESTRICT', onUpdate: 'CASCADE', transaction });
		});
	},

	async down(queryInterface, Sequelize) {
		await queryInterface.dropTable('bank_accounts');
	}
};
