import { Database } from './src/database/index.js';

async function run() {
  await Database.connect();
  const rates = await Database.repository('main', 'exchange-rates').getAll({ count: false });
  console.log("Rates:", rates);
  
  const cur = await Database.repository('main', 'currencies').getAll({ count: false });
  console.log("Currencies:", cur);
  
  const prod = await Database.repository('main', 'products').getAll({ count: false });
  console.log("Products:", prod.map((p: any) => ({id: p.id, price: p.price, currency: p.currency})));
  
  process.exit(0);
}
run().catch(console.error);
