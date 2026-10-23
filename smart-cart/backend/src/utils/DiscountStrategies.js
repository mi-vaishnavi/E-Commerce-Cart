// Strategy pattern: each coupon type knows how to compute its raw discount.
// The base class applies the shared safety caps so every strategy obeys the same rules.
const AppError = require('./AppError');

class DiscountStrategy {
  calculate(coupon, subtotalPaise) {
    const limits = [this.rawDiscount(coupon, subtotalPaise), subtotalPaise]; // never exceed the subtotal
    if (coupon.maxDiscountPaise != null) limits.push(coupon.maxDiscountPaise);
    return Math.max(0, Math.min(...limits));
  }

  rawDiscount() {
    throw new Error('rawDiscount must be implemented by a subclass');
  }
}

class PercentageDiscount extends DiscountStrategy {
  // valuePaise is the percent * 100 (10.00% -> 1000), so percent/100 * subtotal = subtotal * value / 10000
  rawDiscount(coupon, subtotalPaise) {
    return Math.round((subtotalPaise * coupon.valuePaise) / 10000);
  }
}

class FixedDiscount extends DiscountStrategy {
  rawDiscount(coupon) {
    return coupon.valuePaise;
  }
}

const strategies = { PERCENTAGE: new PercentageDiscount(), FIXED: new FixedDiscount() };

function getStrategy(type) {
  const strategy = strategies[type];
  if (!strategy) throw new AppError(500, 'UNKNOWN_COUPON_TYPE', `Unsupported coupon type: ${type}`);
  return strategy;
}

module.exports = { DiscountStrategy, PercentageDiscount, FixedDiscount, getStrategy };
