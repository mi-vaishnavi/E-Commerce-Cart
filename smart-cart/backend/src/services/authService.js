
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function createAuthService(pool) {
  if (!pool) {
    throw new Error('Authentication requires a PostgreSQL connection');
  }

  function createToken(user) {
    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET is not configured');
    }

    return jwt.sign(
      { email: user.email },
      process.env.JWT_SECRET,
      {
        subject: String(user.id),
        expiresIn: process.env.JWT_EXPIRES_IN || '15m',
        algorithm: 'HS256',
      }
    );
  }

  async function register({ name, email, password } = {}) {
    if (
      typeof name !== 'string' ||
      typeof email !== 'string' ||
      typeof password !== 'string'
    ) {
      const error = new Error('Name, email, and password are required');
      error.status = 400;
      throw error;
    }

    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (cleanName.length < 2 || cleanName.length > 100) {
      const error = new Error('Name must contain 2–100 characters');
      error.status = 400;
      throw error;
    }

    if (!EMAIL_PATTERN.test(cleanEmail) || cleanEmail.length > 255) {
      const error = new Error('Enter a valid email address');
      error.status = 400;
      throw error;
    }

    if (
      password.length < 8 ||
      Buffer.byteLength(password, 'utf8') > 72
    ) {
      const error = new Error(
        'Password must be at least 8 characters and at most 72 bytes'
      );
      error.status = 400;
      throw error;
    }

    const passwordHash = await bcrypt.hash(password, 12);

    try {
      const result = await pool.query(
        `INSERT INTO users (name, email, password_hash)
         VALUES ($1, $2, $3)
         RETURNING id, name, email, created_at`,
        [cleanName, cleanEmail, passwordHash]
      );

      const user = result.rows[0];

      return {
        user,
        token: createToken(user),
      };
    } catch (error) {
      if (error.code === '23505') {
        const conflict = new Error(
          'An account with this email already exists'
        );
        conflict.status = 409;
        throw conflict;
      }

      throw error;
    }
  }

  async function login({ email, password } = {}) {
    if (typeof email !== 'string' || typeof password !== 'string') {
      const error = new Error('Email and password are required');
      error.status = 400;
      throw error;
    }

    const cleanEmail = email.trim().toLowerCase();

    const result = await pool.query(
      `SELECT id, name, email, password_hash, created_at
       FROM users
       WHERE email = $1`,
      [cleanEmail]
    );

    const userRecord = result.rows[0];

    if (
      !userRecord ||
      !(await bcrypt.compare(password, userRecord.password_hash))
    ) {
      const error = new Error('Invalid email or password');
      error.status = 401;
      throw error;
    }

    const user = {
      id: userRecord.id,
      name: userRecord.name,
      email: userRecord.email,
      created_at: userRecord.created_at,
    };

    return {
      user,
      token: createToken(user),
    };
  }

  async function getUserById(id) {
    const result = await pool.query(
      `SELECT id, name, email, created_at
       FROM users
       WHERE id = $1`,
      [id]
    );

    return result.rows[0] || null;
  }

  return {
    register,
    login,
    getUserById,
  };
}

module.exports = createAuthService;
