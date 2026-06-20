'use strict';

module.exports = {
	async up(queryInterface, Sequelize) {
		await queryInterface.sequelize.transaction(async (transaction) => {
			// Migrate order_payments
			await queryInterface.sequelize.query(`
				UPDATE order_payments 
				SET payment_method = CASE
					WHEN payment_method IN (1, 2) THEN 1
					WHEN payment_method = 3 THEN 2
					WHEN payment_method = 4 THEN 3
					WHEN payment_method IN (5, 7) THEN 4
					WHEN payment_method = 6 THEN 5
					ELSE payment_method
				END
			`, { transaction });

			// Clear existing bank_accounts
			await queryInterface.bulkDelete('bank_accounts', null, { transaction });

			// Append '-old' to all existing descriptions to avoid UNIQUE constraint violations during updates
			await queryInterface.sequelize.query(`UPDATE payment_methods SET description = description || '-old'`, { transaction });

			// Update payment methods instead of delete to avoid FK constraint errors
			await queryInterface.bulkUpdate('payment_methods', { description: 'Efectivo', requires_reference: false }, { id: 1 }, { transaction });
			await queryInterface.bulkUpdate('payment_methods', { description: 'Punto de Venta', requires_reference: true }, { id: 2 }, { transaction });
			await queryInterface.bulkUpdate('payment_methods', { description: 'Pago Móvil', requires_reference: true }, { id: 3 }, { transaction });
			await queryInterface.bulkUpdate('payment_methods', { description: 'Transferencia Bancaria', requires_reference: true }, { id: 4 }, { transaction });
			await queryInterface.bulkUpdate('payment_methods', { description: 'Puntos de Fidelidad', requires_reference: false }, { id: 5 }, { transaction });

			// Delete redundant payment methods
			await queryInterface.bulkDelete('payment_methods', { id: { [Sequelize.Op.gt]: 5 } }, { transaction });

			// Permissions for payments module
			await queryInterface.bulkInsert('resources', [{ code: 'PAYMENTS_MODULE', description: 'Módulo de Pagos' }], { ignoreDuplicates: true, transaction });

			const [actionRows] = await queryInterface.sequelize.query('SELECT id, code FROM actions', { transaction });
			const [resourceRows] = await queryInterface.sequelize.query('SELECT id, code FROM resources', { transaction });
			const [typeRows] = await queryInterface.sequelize.query('SELECT id, code FROM permission_types', { transaction });

			const actionMap = Object.fromEntries(actionRows.map(r => [r.code, r.id]));
			const resourceMap = Object.fromEntries(resourceRows.map(r => [r.code, r.id]));
			const typeMap = Object.fromEntries(typeRows.map(r => [r.code, r.id]));

			const newPermissions = [
				{ action: actionMap['CREATE'], resource: resourceMap['PAYMENTS_MODULE'], permission_type: typeMap['CRUD'] },
				{ action: actionMap['READ'], resource: resourceMap['PAYMENTS_MODULE'], permission_type: typeMap['CRUD'] },
				{ action: actionMap['UPDATE'], resource: resourceMap['PAYMENTS_MODULE'], permission_type: typeMap['CRUD'] },
				{ action: actionMap['DELETE'], resource: resourceMap['PAYMENTS_MODULE'], permission_type: typeMap['CRUD'] },
			];

			await queryInterface.bulkInsert('permissions', newPermissions, { ignoreDuplicates: true, transaction });

			const [permRows] = await queryInterface.sequelize.query(`SELECT id FROM permissions WHERE resource = ${resourceMap['PAYMENTS_MODULE']}`, { transaction });
			
			// Asignar a TODOS los roles
			const [roles] = await queryInterface.sequelize.query(`SELECT id FROM roles`, { transaction });
			const rolePermissions = [];
			for (const r of roles) {
				for (const p of permRows) {
					rolePermissions.push({ role: r.id, permission: p.id });
				}
			}
			if (rolePermissions.length > 0) {
				await queryInterface.bulkInsert('role_permissions', rolePermissions, { ignoreDuplicates: true, transaction });
			}

			// Seed bank accounts
			const [banks] = await queryInterface.sequelize.query(`SELECT id FROM banks WHERE code = '0201' LIMIT 1;`, { transaction });
			const [currencies] = await queryInterface.sequelize.query(`SELECT id FROM currencies WHERE code = 'VES' LIMIT 1;`, { transaction });
			
			if (banks.length && currencies.length) {
				const accounts = [
					{
						bank: banks[0].id,
						currency: currencies[0].id,
						payment_method: 4, // Transferencia Bancaria
						payment_details: JSON.stringify({
							account_number: "02013464119733167401",
							identity_document: "J-123456789"
						})
					},
					{
						bank: banks[0].id,
						currency: currencies[0].id,
						payment_method: 3, // Pago Móvil
						payment_details: JSON.stringify({
							phone_number: "04121234567",
							identity_document: "J-123456789"
						})
					}
				];
				await queryInterface.bulkInsert('bank_accounts', accounts, { transaction });
			}
		});
	},

	async down(queryInterface, Sequelize) {
		await queryInterface.bulkDelete('bank_accounts', null, {});
		await queryInterface.bulkDelete('payment_methods', null, {});
	}
};
