const fs = require('fs');
const { Database } = require('./build/database/index.js');
async function run() {
    await Database.connect();
    const bankAccounts = await Database.repository('main', 'bank-accounts').findAll({
        include: [{ model: Database.model('main', 'banks'), as: '_Banks' }]
    });
    console.log(JSON.stringify(bankAccounts, null, 2));
    process.exit(0);
}
run();
