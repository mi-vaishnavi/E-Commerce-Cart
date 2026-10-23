
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');

function createControllers({
  productRepo,
  cartService,
  couponService,
  checkoutService,
  orderService,
  pricing,
  mode,
}) {
  return {
    health: (_req, res) => {
      res.json({ status: 'ok', database: mode });
    },

    // Public product endpoints
    listProducts: asyncHandler(async (req, res) => {
      const category =
        typeof req.query.category === 'string'
          ? req.query.category.trim()
          : '';

      const products = await productRepo.list({
        category: category || undefined,
      });

      res.json({
        products: products.map((product) => product.toApi()),
      });
    }),

    getProduct: asyncHandler(async (req, res) => {
      const product = await productRepo.findById(req.valid.productId);

      if (!product || !product.isActive) {
        throw new AppError(
          404,
          'PRODUCT_NOT_FOUND',
          'That product does not exist.'
        );
      }

      res.json({ product: product.toApi() });
    }),

    // Authenticated user's cart
    getCart: asyncHandler(async (req, res) => {
      res.json({
        cart: await cartService.getCart(req.user.id),
      });
    }),

    addCartItem: asyncHandler(async (req, res) => {
      const { productId, quantity } = req.valid;

      res.status(201).json({
        cart: await cartService.addItem(
          req.user.id,
          productId,
          quantity
        ),
      });
    }),

    updateCartItem: asyncHandler(async (req, res) => {
      const { productId, quantity } = req.valid;

      res.json({
        cart: await cartService.updateQuantity(
          req.user.id,
          productId,
          quantity
        ),
      });
    }),

    removeCartItem: asyncHandler(async (req, res) => {
      res.json({
        cart: await cartService.removeItem(
          req.user.id,
          req.valid.productId
        ),
      });
    }),

    // Coupons
    listCoupons: asyncHandler(async (_req, res) => {
      res.json({
        coupons: await couponService.listCoupons(),
      });
    }),

    validateCoupon: asyncHandler(async (req, res) => {
      res.json(
        await couponService.validate(
          req.valid.code,
          req.valid.appliedCode,
          req.user.id
        )
      );
    }),

    recommendCoupon: asyncHandler(async (req, res) => {
      res.json(
        await couponService.recommend(
          req.valid.appliedCode,
          req.user.id
        )
      );
    }),

    // Checkout
    previewCheckout: asyncHandler(async (req, res) => {
      res.json({
        breakdown: await checkoutService.preview(
          req.valid.couponCode,
          req.user.id
        ),
      });
    }),

    // Orders
    placeOrder: asyncHandler(async (req, res) => {
      const { order, duplicate } = await orderService.placeOrder({
        ...req.valid,
        userId: req.user.id,
      });

      res.status(duplicate ? 200 : 201).json({
        order: order.toApi(),
        duplicate,
      });
    }),

    getOrder: asyncHandler(async (req, res) => {
      const order = await orderService.getOrder(
        req.valid.orderNumber,
        req.user.id
      );

      res.json({ order: order.toApi() });
    }),
  };
}

module.exports = createControllers;
