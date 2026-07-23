'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
	async up(queryInterface, Sequelize) {
		const [accounts] = await queryInterface.sequelize.query('SELECT id, payment_details FROM bank_accounts');

		await queryInterface.sequelize.transaction(async (transaction) => {
			for (const account of accounts) {
				let details = account.payment_details;

				// Según la configuración, Postgres devuelve el JSON casteado a object/array o como string.
				if (typeof details === 'string') {
					try {
						details = JSON.parse(details);
					} catch (e) {
						details = [];
					}
				}

				if (Array.isArray(details)) {
					let changed = false;
					const updatedDetails = details.map((detail) => {
						if (!detail.name) {
							const labelLower = String(detail.label).toLowerCase();
							let name = detail.name;

							if (labelLower.includes('cuenta')) {
								name = 'account_number';
								changed = true;
							} else if (labelLower.includes('documento') || labelLower.includes('cédula') || labelLower.includes('cedula') || labelLower.includes('rif')) {
								name = 'identity_document';
								changed = true;
							} else if (labelLower.includes('teléfono') || labelLower.includes('telefono') || labelLower.includes('celular')) {
								name = 'phone_number';
								changed = true;
							} else if (labelLower.includes('correo') || labelLower.includes('email')) {
								name = 'email';
								changed = true;
							}

							return { ...detail, name };
						}
						return detail;
					});

					if (changed) {
						await queryInterface.sequelize.query(
							`UPDATE bank_accounts SET payment_details = :details WHERE id = :id`,
							{
								replacements: {
									details: JSON.stringify(updatedDetails),
									id: account.id
								},
								transaction
							}
						);
					}
				}
			}
		});
	},

	async down(queryInterface, Sequelize) {
		const [accounts] = await queryInterface.sequelize.query('SELECT id, payment_details FROM bank_accounts');

		await queryInterface.sequelize.transaction(async (transaction) => {
			for (const account of accounts) {
				let details = account.payment_details;
				
				if (typeof details === 'string') {
					try {
						details = JSON.parse(details);
					} catch (e) {
						details = [];
					}
				}

				if (Array.isArray(details)) {
					const updatedDetails = details.map((detail) => {
						const { name, ...rest } = detail;
						return rest;
					});

					await queryInterface.sequelize.query(
						`UPDATE bank_accounts SET payment_details = :details WHERE id = :id`,
						{
							replacements: {
								details: JSON.stringify(updatedDetails),
								id: account.id
							},
							transaction
						}
					);
				}
			}
		});
	}
};
