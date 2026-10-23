const AppError = require('../utils/AppError');

const DB_DOWN_CODES = new Set(['ECONNREFUSED', 'ENOTFOUND', 'ETIMEDOUT', 'ECONNRESET', '57P01', '57P03', '08000', '08003', '08006']);

function notFound(req, _res, next) {
  next(new AppError(404, 'ROUTE_NOT_FOUND', `${req.method} ${req.originalUrl} does not exist.`));
}

// Express recognises 4-argument functions as error handlers.
// eslint-disable-next-line no-unused-vars
function errorHandler(err, _req, res, _next) {
  let status = 500;
  let code = 'INTERNAL_ERROR';
  let message = 'Something went wrong on our side. Please try again.';
  let details;

  if (err instanceof AppError) {
    ({ status, code, message, details } = err);
  } else if (err.type === 'entity.parse.failed') {
    status = 400; code = 'INVALID_JSON'; message = 'Request body is not valid JSON.';
  } else if (err.type === 'entity.too.large') {
    status = 413; code = 'PAYLOAD_TOO_LARGE'; message = 'Request body is too large.';
  } else if (DB_DOWN_CODES.has(err.code) || (err.errors && err.errors.some((e) => DB_DOWN_CODES.has(e.code)))) {
    status = 503; code = 'DATABASE_UNAVAILABLE'; message = 'The database is temporarily unavailable. Please try again shortly.';
  } else if (err.code === '42P01') {
    status = 500; code = 'DATABASE_NOT_INITIALISED'; message = 'Database tables are missing. Run "npm run db:setup" in the backend folder.';
  } else if (err.code === '23505') {
    status = 409; code = 'CONFLICT'; message = 'That record already exists.';
  }

  if (status >= 500) console.error(`[${code}]`, err);
  res.status(status).json({ error: { code, message, ...(details ? { details } : {}) } });
}

module.exports = { notFound, errorHandler };
