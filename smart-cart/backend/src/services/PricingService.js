// Single source of truth for money math. Cart, coupon validation, recommendations, checkout preview
// and order placement ALL call this class, so the numbers can never disagree.
const AppError = require('../utils/AppError');
const { getStrategy } = require('../utils/DiscountStrategies');
const { fromPaise, formatInr } = require('../utils/money');

class PricingService {
  constructor({ taxRatePercent }) {
    this.taxRatePercent = taxRatePercent;
    this.taxBasisPoints = Math.round(taxRatePercent * 100); // 5% -> 500
  }

  // lines: [{ product, quantity }]
  summarizeLines(lines) {
    const items = lines.map(({ product, quantity }) => ({
      productId: product.id,
      name: product.name,
      category: product.category,
      imageUrl: product.imageUrl,
      stockQuantity: product.stockQuantity,
      unitPricePaise: product.pricePaise,
      quantity,
      lineTotalPaise: product.pricePaise * quantity,
    }));
    return {
      items,
      itemCount: items.reduce((n, i) => n + i.quantity, 0),
      subtotalPaise: items.reduce((sum, i) => sum + i.lineTotalPaise, 0),
    };
  }

  // Returns { eligible, code, reason, discountPaise } for one coupon against one subtotal.
  evaluateCoupon(coupon, subtotalPaise, now = new Date()) {
    if (!coupon.isActive) {
      return { eligible: false, code: 'COUPON_INACTIVE', reason: `Coupon ${coupon.code} is no longer active.`, discountPaise: 0 };
    }
    if (coupon.isExpired(now)) {
      return { eligible: false, code: 'COUPON_EXPIRED', reason: `Coupon ${coupon.code} has expired.`, discountPaise: 0 };
    }
    if (subtotalPaise < coupon.minSubtotalPaise) {
      const shortBy = coupon.minSubtotalPaise - subtotalPaise;
      return {
        eligible: false,
        code: 'COUPON_MIN_NOT_MET',
        reason: `${coupon.code} needs a minimum order of ${formatInr(coupon.minSubtotalPaise)}. Add ${formatInr(shortBy)} more.`,
        shortByPaise: shortBy,
        discountPaise: 0,
      };
    }
    const discountPaise = getStrategy(coupon.type).calculate(coupon, subtotalPaise);
    return { eligible: true, code: null, reason: null, discountPaise };
  }

  // couponCode is what the customer asked for; coupon is what the database returned for it (or null).
  price(lines, { coupon = null, couponCode = null, now = new Date() } = {}) {
    const summary = this.summarizeLines(lines);
    let discountPaise = 0;
    let appliedCoupon = null;

    if (couponCode) {
      if (!coupon) throw new AppError(404, 'COUPON_NOT_FOUND', `Coupon "${couponCode}" does not exist.`);
      const result = this.evaluateCoupon(coupon, summary.subtotalPaise, now);
      if (!result.eligible) throw new AppError(400, result.code, result.reason);
      discountPaise = result.discountPaise;
      appliedCoupon = coupon;
    }

    const taxablePaise = summary.subtotalPaise - discountPaise;
    const taxPaise = Math.round((taxablePaise * this.taxBasisPoints) / 10000);
    return {
      ...summary,
      coupon: appliedCoupon,
      discountPaise,
      taxablePaise,
      taxPaise,
      totalPaise: taxablePaise + taxPaise,
    };
  }

  toApi(b) {
    return {
      items: b.items.map((i) => ({
        productId: i.productId,
        name: i.name,
        category: i.category,
        imageUrl: i.imageUrl,
        stockQuantity: i.stockQuantity,
        unitPrice: fromPaise(i.unitPricePaise),
        quantity: i.quantity,
        lineTotal: fromPaise(i.lineTotalPaise),
      })),
      itemCount: b.itemCount,
      subtotal: fromPaise(b.subtotalPaise),
      coupon: b.coupon ? { ...b.coupon.toApi(), discountAmount: fromPaise(b.discountPaise) } : null,
      discount: fromPaise(b.discountPaise),
      taxRatePercent: this.taxRatePercent,
      tax: fromPaise(b.taxPaise),
      total: fromPaise(b.totalPaise),
      currency: 'INR',
      simulated: true,
    };
  }
}
module.exports = PricingService;
