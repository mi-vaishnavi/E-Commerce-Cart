
const AppError = require('../utils/AppError');
const { fromPaise } = require('../utils/money');

const normalize = (code) => String(code || '').trim().toUpperCase();

class CouponService {
  constructor({ couponRepo, cartService, pricing }) {
    this.couponRepo = couponRepo;
    this.cartService = cartService;
    this.pricing = pricing;
  }

  async listCoupons() {
    const coupons = await this.couponRepo.listActive();
    const now = Date.now();

    return coupons
      .filter(
        (coupon) =>
          !coupon.expiresAt ||
          new Date(coupon.expiresAt).getTime() > now
      )
      .map((coupon) => coupon.toApi());
  }

  async validate(code, appliedCode, userId) {
    const wanted = normalize(code);

    if (!wanted) {
      throw new AppError(
        400,
        'COUPON_CODE_REQUIRED',
        'Enter a coupon code.'
      );
    }

    if (appliedCode && normalize(appliedCode) === wanted) {
      throw new AppError(
        409,
        'COUPON_ALREADY_APPLIED',
        `${wanted} is already applied to this order.`
      );
    }

    const lines = await this.cartService.getLines(userId);

    if (!lines.length) {
      throw new AppError(
        400,
        'EMPTY_CART',
        'Add items to your cart before applying a coupon.'
      );
    }

    const coupon = await this.couponRepo.findByCode(wanted);

    if (!coupon) {
      throw new AppError(
        404,
        'COUPON_NOT_FOUND',
        'This coupon code does not exist.'
      );
    }

    const breakdown = this.pricing.price(lines, {
      coupon,
      couponCode: wanted,
    });

    return {
      valid: true,
      coupon: coupon.toApi(),
      discountAmount: fromPaise(breakdown.discountPaise),
      breakdown: this.pricing.toApi(breakdown),
    };
  }

  async recommend(appliedCode, userId) {
    const lines = await this.cartService.getLines(userId);

    const empty = {
      recommendation: null,
      options: [],
      hint: null,
    };

    if (!lines.length) {
      return empty;
    }

    const { subtotalPaise } = this.pricing.summarizeLines(lines);
    const applied = appliedCode ? normalize(appliedCode) : null;
    const coupons = await this.couponRepo.listActive();
    const now = Date.now();

    const activeCoupons = coupons.filter(
      (coupon) =>
        !coupon.expiresAt ||
        new Date(coupon.expiresAt).getTime() > now
    );

    const options = activeCoupons.map((coupon) => {
      const result = this.pricing.evaluateCoupon(
        coupon,
        subtotalPaise
      );

      return {
        coupon: coupon.toApi(),
        eligible: result.eligible,
        savings: fromPaise(result.discountPaise),
        reason: result.reason,
        reasonCode: result.code,
        shortBy: fromPaise(result.shortByPaise || 0),
      };
    });

    const eligibleOptions = options
      .filter(
        (option) =>
          option.eligible &&
          normalize(option.coupon.code) !== applied
      )
      .sort((a, b) => b.savings - a.savings);

    const recommendation = eligibleOptions[0] || null;

    const hints = options
      .filter(
        (option) =>
          !option.eligible &&
          option.shortBy > 0
      )
      .sort((a, b) => a.shortBy - b.shortBy);

    const hint = hints.length
      ? {
          coupon: hints[0].coupon,
          amountNeeded: hints[0].shortBy,
          message: `Add ₹${hints[0].shortBy.toFixed(2)} more to qualify for ${hints[0].coupon.code}.`,
        }
      : null;

    return {
      recommendation,
      options,
      hint,
    };
  }
}

module.exports = CouponService;
module.exports.normalize = normalize;
