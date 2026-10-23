const { toPaise, fromPaise } = require('../utils/money');

class Coupon {
  constructor({ id, code, description, type, valuePaise, minSubtotalPaise, maxDiscountPaise, expiresAt, isActive }) {
    Object.assign(this, { id, code, description, type, valuePaise, minSubtotalPaise, maxDiscountPaise, expiresAt, isActive });
  }

  static fromRow(row) {
    return new Coupon({
      id: row.id,
      code: row.code,
      description: row.description,
      type: row.type,
      valuePaise: toPaise(row.discount_value),
      minSubtotalPaise: toPaise(row.min_subtotal),
      maxDiscountPaise: row.max_discount == null ? null : toPaise(row.max_discount),
      expiresAt: row.expires_at ? new Date(row.expires_at) : null,
      isActive: row.is_active,
    });
  }

  isExpired(now = new Date()) {
    return this.expiresAt !== null && this.expiresAt <= now;
  }

  toApi() {
    return {
      code: this.code,
      type: this.type,
      description: this.description,
      discountValue: fromPaise(this.valuePaise),
      minSubtotal: fromPaise(this.minSubtotalPaise),
      maxDiscount: this.maxDiscountPaise == null ? null : fromPaise(this.maxDiscountPaise),
    };
  }
}
module.exports = Coupon;
