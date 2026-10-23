
const Coupon = require('../../models/Coupon');

class CouponRepository {
  constructor(pool) {
    this.pool = pool;
  }

  async findByCode(code) {
    const { rows } = await this.pool.query(
      `SELECT *
       FROM coupons
       WHERE code = $1
         AND is_active = TRUE
         AND (expires_at IS NULL OR expires_at > NOW())`,
      [code]
    );

    return rows[0] ? Coupon.fromRow(rows[0]) : null;
  }

  async listActive() {
    const { rows } = await this.pool.query(
      `SELECT *
       FROM coupons
       WHERE is_active = TRUE
         AND (expires_at IS NULL OR expires_at > NOW())
       ORDER BY code`
    );

    return rows.map((row) => Coupon.fromRow(row));
  }
}

module.exports = CouponRepository;
