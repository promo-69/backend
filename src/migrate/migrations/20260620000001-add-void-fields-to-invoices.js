'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.sequelize.transaction(async (transaction) => {
            await queryInterface.addColumn(
                'invoices',
                'voided_reason',
                {
                    type: Sequelize.TEXT,
                    allowNull: true,
                    defaultValue: null,
                },
                { transaction },
            );

            await queryInterface.addColumn(
                'invoices',
                'voided_by',
                {
                    type: Sequelize.INTEGER,
                    allowNull: true,
                    defaultValue: null,
                },
                { transaction },
            );

            await queryInterface.addConstraint('invoices', {
                fields: ['voided_by'],
                type: 'foreign key',
                name: 'fk_invoices_voided_by_employee',
                references: { table: 'employees', field: 'id' },
                onDelete: 'SET NULL',
                onUpdate: 'CASCADE',
                transaction,
            });
        });
    },

    async down(queryInterface) {
        await queryInterface.sequelize.transaction(async (transaction) => {
            await queryInterface.removeConstraint('invoices', 'fk_invoices_voided_by_employee', { transaction });
            await queryInterface.removeColumn('invoices', 'voided_by', { transaction });
            await queryInterface.removeColumn('invoices', 'voided_reason', { transaction });
        });
    },
};
