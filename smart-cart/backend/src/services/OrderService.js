
const crypto = require('crypto');
const AppError = require('../utils/AppError');
const { toDecimal } = require('../utils/money');
const { normalize } = require('./CouponService');

class OrderService {
  constructor({ orderRepo, pricing }) {
    this.orderRepo = orderRepo;
    this.pricing = pricing;
  }

  #newOrderNumber() {
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    return `ORD-${date}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
  }

  async placeOrder({
    userId,
    customerName,
    customerEmail,
    shippingAddress,
    couponCode,
    idempotencyKey,
  }) {
    if (!userId) {
      throw new AppError(401, 'AUTH_REQUIRED', 'Please log in to place an order.');
    }

    const previous = await this.orderRepo.findByIdempotencyKey(
      idempotencyKey,
      userId
    );

    if (previous) return { order: previous, duplicate: true };

    const code = couponCode ? normalize(couponCode) : null;
    const orderNumber = this.#newOrderNumber();

    try {
      await this.orderRepo.withTransaction(userId, async (tx) => {
        const cartItems = await tx.getCartItems();

        if (!cartItems.length) {
          throw new AppError(400, 'EMPTY_CART', 'Your cart is empty.');
        }

        const products = await tx.lockProducts(
          cartItems.map((item) => item.productId)
        );

        const byId = new Map(products.map((product) => [product.id, product]));

        const lines = cartItems.map(({ productId, quantity }) => {
          const product = byId.get(productId);

          if (!product || !product.isActive) {
            throw new AppError(
              409,
              'PRODUCT_UNAVAILABLE',
              'A product in your cart is no longer available.'
            );
          }

          if (quantity > product.stockQuantity) {
            throw new AppError(
              409,
              'INSUFFICIENT_STOCK',
              `Only ${product.stockQuantity} of ${product.name} left in stock.`
            );
          }

          return { product, quantity };
        });

        const coupon = code ? await tx.findCoupon(code) : null;
        const breakdown = this.pricing.price(lines, {
          coupon,
          couponCode: code,
        });

        for (const item of breakdown.items) {
          await tx.decrementStock(item.productId, item.quantity);
        }

        const orderId = await tx.insertOrder({
          orderNumber,
          idempotencyKey,
          customerName,
          customerEmail,
          shippingAddress,
          subtotal: toDecimal(breakdown.subtotalPaise),
          discount: toDecimal(breakdown.discountPaise),
          tax: toDecimal(breakdown.taxPaise),
          total: toDecimal(breakdown.totalPaise),
          couponCode: breakdown.coupon ? breakdown.coupon.code : null,
          status: 'CONFIRMED',
        });

        await tx.insertOrderItems(
          orderId,
          breakdown.items.map((item) => ({
            productId: item.productId,
            name: item.name,
            unitPrice: toDecimal(item.unitPricePaise),
            quantity: item.quantity,
            lineTotal: toDecimal(item.lineTotalPaise),
          }))
        );

        // Only this user's cart is cleared.
        await tx.clearCart();
      });
    } catch (err) {
      if (err.code === 'DUPLICATE_ORDER') {
        const existing = await this.orderRepo.findByIdempotencyKey(
          idempotencyKey,
          userId
        );

        if (existing) return { order: existing, duplicate: true };
      }

      throw err;
    }

    return {
      order: await this.orderRepo.findByOrderNumber(orderNumber, userId),
      duplicate: false,
    };
  }

  async getOrder(orderNumber, userId) {
    const order = await this.orderRepo.findByOrderNumber(orderNumber, userId);

    if (!order) {
      // Also return 404 when the order belongs to another user.
      throw new AppError(
        404,
        'ORDER_NOT_FOUND',
        `Order ${orderNumber} was not found.`
      );
    }

    return order;
  }
}

module.exports = OrderService;
