require('dotenv').config();

const toBool = (value, fallback) =>
  value === undefined ? fallback : String(value).trim().toLowerCase() === 'true';

const taxRate = Number(process.env.TAX_RATE_PERCENT ?? 5);

module.exports = {
  port: Number(process.env.PORT) || 5000,
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  dbMode: (process.env.DB_MODE || 'postgres').toLowerCase(),
  allowMemoryFallback: toBool(process.env.ALLOW_MEMORY_FALLBACK, false),
  databaseUrl: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/smart_cart',
  taxRatePercent: Number.isFinite(taxRate) && taxRate >= 0 ? taxRate : 0,
};
