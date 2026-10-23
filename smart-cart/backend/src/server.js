const env = require('./config/env');
const { createPool } = require('./config/db');
const { createRepositories } = require('./repositories');
const createApp = require('./app');

async function bootstrap() {
  let mode = env.dbMode;
  let pool = null;

  if (mode === 'postgres') {
    try {
      pool = createPool();
      await pool.query('SELECT 1 FROM products LIMIT 1');
      console.log('[db] Connected to PostgreSQL');
    } catch (err) {
      const hint = err.code === '42P01'
        ? 'Tables are missing. Run: npm run db:setup'
        : 'Check that PostgreSQL is running and DATABASE_URL in backend/.env is correct.';
      console.error(`[db] PostgreSQL check failed: ${err.message || err.code}\n[db] ${hint}`);
      if (pool) await pool.end().catch(() => {});
      if (!env.allowMemoryFallback) {
        console.error('[db] Exiting. (Set ALLOW_MEMORY_FALLBACK=true to run with the non-persistent in-memory store.)');
        process.exit(1);
      }
      mode = 'memory';
      pool = null;
    }
  }

  if (mode === 'memory') {
    console.warn('[db] *** IN-MEMORY MODE: data is NOT persistent and resets on restart. PostgreSQL is not in use. ***');
  }

  // const app = createApp(createRepositories(mode, pool), mode);
  const app = createApp(createRepositories(mode, pool), mode, pool);
  app.listen(env.port, () => console.log(`[api] Smart Cart API running on http://localhost:${env.port} (db: ${mode})`));
}

bootstrap();
