'use strict';

/**
 * Agrega el rastro de pago a las solicitudes de alquiler, necesario para el
 * cobro desde taquilla (POS): método, referencia, empleado que cobró y fecha.
 * @type {import('sequelize-cli').Migration}
 */
module.exports = {
	async up(queryInterface, Sequelize) {
		await queryInterface.sequelize.transaction(async (transaction) => {
			await queryInterface.addColumn(
				'rental_requests',
				'payment_method',
				{ type: Sequelize.INTEGER, allowNull: true },
				{ transaction },
			);
			await queryInterface.addColumn(
				'rental_requests',
				'payment_reference',
				{ type: Sequelize.STRING(255), allowNull: true },
				{ transaction },
			);
			await queryInterface.addColumn(
				'rental_requests',
				'paid_by_employee',
				{ type: Sequelize.INTEGER, allowNull: true },
				{ transaction },
			);
			await queryInterface.addColumn(
				'rental_requests',
				'paid_at',
				{ type: Sequelize.DATE, allowNull: true },
				{ transaction },
			);

			// FK del método de pago hacia el catálogo existente
			await queryInterface.addConstraint('rental_requests', {
				fields: ['payment_method'],
				type: 'foreign key',
				name: 'fk_rental_requests_payment_method',
				references: { table: 'payment_methods', field: 'id' },
				onDelete: 'SET NULL',
				onUpdate: 'CASCADE',
				transaction,
			});
			// FK del empleado que registró el cobro
			await queryInterface.addConstraint('rental_requests', {
				fields: ['paid_by_employee'],
				type: 'foreign key',
				name: 'fk_rental_requests_paid_by_employee',
				references: { table: 'employees', field: 'id' },
				onDelete: 'SET NULL',
				onUpdate: 'CASCADE',
				transaction,
			});
		});
	},

	async down(queryInterface) {
		await queryInterface.sequelize.transaction(async (transaction) => {
			await queryInterface.removeConstraint('rental_requests', 'fk_rental_requests_paid_by_employee', {
				transaction,
			});
			await queryInterface.removeConstraint('rental_requests', 'fk_rental_requests_payment_method', {
				transaction,
			});
			await queryInterface.removeColumn('rental_requests', 'paid_at', { transaction });
			await queryInterface.removeColumn('rental_requests', 'paid_by_employee', { transaction });
			await queryInterface.removeColumn('rental_requests', 'payment_reference', { transaction });
			await queryInterface.removeColumn('rental_requests', 'payment_method', { transaction });
		});
	},
};
