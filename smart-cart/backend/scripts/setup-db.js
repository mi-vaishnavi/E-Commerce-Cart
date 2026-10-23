// Creates tables and seeds data using the same DATABASE_URL as the API (no psql needed).
// Usage: npm run db:setup   |   npm run db:reset  (drops all tables first)
const fs = require('fs');
const path = require('path');
const { createPool } = require('../src/config/db');

async function main() {
  const reset = process.argv.includes('--reset');
  const pool = createPool();
  try {
    if (reset) {
      await pool.query('DROP TABLE IF EXISTS order_items, orders, cart_items, coupons, products CASCADE');
      console.log('Dropped existing tables.');
    }
    for (const file of ['schema.sql', 'seed.sql']) {
      const sql = fs.readFileSync(path.join(__dirname, '..', '..', 'database', file), 'utf8');
      await pool.query(sql);
      console.log(`Ran ${file}`);
    }
    const { rows } = await pool.query('SELECT (SELECT COUNT(*) FROM products) AS products, (SELECT COUNT(*) FROM coupons) AS coupons');
    console.log(`Done. products=${rows[0].products}, coupons=${rows[0].coupons}`);
  } catch (err) {
    console.error('Database setup failed:', err.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}
main();
