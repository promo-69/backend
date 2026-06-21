'use strict';

/**
 * Migración / Seeder para rectificar el formato de payment_details.
 * Transforma el objeto previo a un arreglo de objetos [{ label, value }].
 *
 * @type {import('sequelize-cli').Migration}
 */
module.exports = {
    async up(queryInterface, Sequelize) {
        const [accounts] = await queryInterface.sequelize.query(`SELECT id, payment_details FROM bank_accounts`);
        
        for (const account of accounts) {
            if (!account.payment_details) continue;

            let details;
            try {
                details = typeof account.payment_details === 'string' ? JSON.parse(account.payment_details) : account.payment_details;
            } catch (e) { continue; }

            // Si ya es un arreglo, lo saltamos
            if (Array.isArray(details)) continue;

            const newDetailsArray = [];
            
            for (const key in details) {
                const val = details[key];
                
                if (val && typeof val === 'object' && val.label && val.value) {
                    newDetailsArray.push({ label: val.label, value: val.value });
                } else if (val && typeof val !== 'object') {
                    // Si por casualidad todavía estaba plano
                    let label = key;
                    if (key === 'account_number') label = 'Número de Cuenta';
                    else if (key === 'identity_document') label = 'Documento';
                    else if (key === 'phone_number') label = 'Número de Teléfono';
                    else if (key === 'email') label = 'Correo Electrónico';
                    
                    newDetailsArray.push({ label, value: val });
                }
            }

            if (newDetailsArray.length > 0) {
                await queryInterface.sequelize.query(
                    `UPDATE bank_accounts SET payment_details = :details WHERE id = :id`,
                    {
                        replacements: { details: JSON.stringify(newDetailsArray), id: account.id }
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

            // Si NO es un arreglo, lo saltamos
            if (!Array.isArray(details)) continue;

            const oldDetailsObject = {};
            
            for (const item of details) {
                if (item.label && item.value) {
                    // Mapeo inverso aproximado (solo para el rollback)
                    let key = 'unknown';
                    if (item.label === 'Número de Cuenta') key = 'account_number';
                    else if (item.label === 'Documento') key = 'identity_document';
                    else if (item.label === 'Número de Teléfono') key = 'phone_number';
                    else if (item.label === 'Correo Electrónico') key = 'email';
                    
                    oldDetailsObject[key] = { label: item.label, value: item.value };
                }
            }

            if (Object.keys(oldDetailsObject).length > 0) {
                await queryInterface.sequelize.query(
                    `UPDATE bank_accounts SET payment_details = :details WHERE id = :id`,
                    {
                        replacements: { details: JSON.stringify(oldDetailsObject), id: account.id }
                    }
                );
            }
        }
    }
};
