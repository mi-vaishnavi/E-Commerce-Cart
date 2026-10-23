
const { Router } = require('express');
const v = require('../middleware/validators');
const authenticateToken = require('../middleware/authenticateToken');

function createApiRouter(c) {
  const router = Router();

  // Public routes
  router.get('/health', c.health);
  router.get('/products', c.listProducts);
  router.get('/products/:id', v.productIdParam, c.getProduct);

  // Authentication required for shopping operations
  router.use(authenticateToken);
  router.get('/coupons', c.listCoupons);

  router.get('/cart', c.getCart);
  router.post('/cart/items', v.addItem, c.addCartItem);
  router.patch('/cart/items/:productId', v.updateQuantity, c.updateCartItem);
  router.delete(
    '/cart/items/:productId',
    v.productIdParam,
    c.removeCartItem
  );

  router.post('/coupons/validate', v.validateCoupon, c.validateCoupon);
  router.post('/coupons/recommend', v.recommendCoupon, c.recommendCoupon);

  router.post('/checkout/preview', v.previewCheckout, c.previewCheckout);

  router.post('/orders', v.placeOrder, c.placeOrder);
  router.get('/orders/:orderId', v.orderNumberParam, c.getOrder);

  return router;
}

module.exports = createApiRouter;
