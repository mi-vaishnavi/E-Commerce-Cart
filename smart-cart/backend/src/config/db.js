const { Pool } = require('pg');
const env = require('./env');

function createPool() {
  const pool = new Pool({ connectionString: env.databaseUrl, max: 10, connectionTimeoutMillis: 5000 });
  // An idle client erroring (e.g. DB restarted) must not crash the process.
  pool.on('error', (err) => console.error('[pg] idle client error:', err.message));
  return pool;
}

module.exports = { createPool };
