const { normalize } = require('./CouponService');

class CheckoutService {
  constructor({ cartService, couponRepo, pricing }) {
    this.cartService = cartService;
    this.couponRepo = couponRepo;
    this.pricing = pricing;
  }

  // The authoritative price breakdown. The client never sends prices or discount amounts.
  async preview(couponCode) {
    const lines = await this.cartService.getLines();
    const code = couponCode ? normalize(couponCode) : null;
    const coupon = code ? await this.couponRepo.findByCode(code) : null;
    return this.pricing.toApi(this.pricing.price(lines, { coupon, couponCode: code }));
  }
}
module.exports = CheckoutService;
