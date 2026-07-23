'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
	async up(queryInterface, Sequelize) {
		const [accounts] = await queryInterface.sequelize.query(`SELECT id, payment_details FROM bank_accounts`);
		for (const account of accounts) {
			if (!account.payment_details) continue;
			
			let details;
			try {
				details = typeof account.payment_details === 'string' ? JSON.parse(account.payment_details) : account.payment_details;
			} catch (e) { continue; }

			let needsUpdate = false;
			const newDetails = {};

			for (const key in details) {
				const val = details[key];
				if (val && typeof val !== 'object') {
					let label = key;
					if (key === 'account_number') label = 'Número de Cuenta';
					else if (key === 'identity_document') label = 'Documento';
					else if (key === 'phone_number') label = 'Número de Teléfono';
					else if (key === 'email') label = 'Correo Electrónico';
					
					newDetails[key] = { label, value: val };
					needsUpdate = true;
				} else {
					newDetails[key] = val;
				}
			}

			if (needsUpdate) {
				await queryInterface.sequelize.query(
					`UPDATE bank_accounts SET payment_details = :details WHERE id = :id`,
					{
						replacements: { details: JSON.stringify(newDetails), id: account.id }
					}
				);
			}
		}
	},

	async down(queryInterface, Sequelize) {
		const [accounts] = await queryInterface.sequelize.query(`SELECT id, payment_details FROM bank_accounts`);
		for (const account of accounts) {
			if (!account.payment_details) continue;
			
			let details;
			try {
				details = typeof account.payment_details === 'string' ? JSON.parse(account.payment_details) : account.payment_details;
			} catch (e) { continue; }

			let needsUpdate = false;
			const newDetails = {};

			for (const key in details) {
				const val = details[key];
				if (val && typeof val === 'object' && val.value !== undefined) {
					newDetails[key] = val.value;
					needsUpdate = true;
				} else {
					newDetails[key] = val;
				}
			}

			if (needsUpdate) {
				await queryInterface.sequelize.query(
					`UPDATE bank_accounts SET payment_details = :details WHERE id = :id`,
					{
						replacements: { details: JSON.stringify(newDetails), id: account.id }
					}
				);
			}
		}
	}
};
