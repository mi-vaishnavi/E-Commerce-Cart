
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const env = require('./config/env');
const createApiRouter = require('./routes/api');
const createControllers = require('./controllers');
const { notFound, errorHandler } = require('./middleware/errorHandler');

const createAuthService = require('./services/authService');
const createAuthController = require('./controllers/authController');
const createAuthRouter = require('./routes/authRoutes');

const PricingService = require('./services/PricingService');
const CartService = require('./services/CartService');
const CouponService = require('./services/CouponService');
const CheckoutService = require('./services/CheckoutService');
const OrderService = require('./services/OrderService');

function createApp(repos, mode, pool) {
  // Initialize existing e-commerce services.
  const pricing = new PricingService({
    taxRatePercent: env.taxRatePercent,
  });

  const cartService = new CartService({
    cartRepo: repos.cart,
    productRepo: repos.products,
    pricing,
  });

  const couponService = new CouponService({
    couponRepo: repos.coupons,
    cartService,
    pricing,
  });

  const checkoutService = new CheckoutService({
    cartService,
    couponRepo: repos.coupons,
    pricing,
  });

  const orderService = new OrderService({
    orderRepo: repos.orders,
    pricing,
  });

  // Initialize existing e-commerce controllers.
  const controllers = createControllers({
    productRepo: repos.products,
    cartService,
    couponService,
    checkoutService,
    orderService,
    pricing,
    mode,
  });

  const app = express();

  // Global middleware.
  app.use(cors({
    origin: env.corsOrigin,
    credentials: true,
  }));

  app.use(express.json({ limit: '10kb' }));
  app.use(cookieParser());

  // JWT authentication routes.
  if (pool) {
    const authService = createAuthService(pool);
    const authController = createAuthController(authService);

    app.use('/api/auth', createAuthRouter(authController));
  } else {
    // Authentication requires PostgreSQL.
    app.use('/api/auth', (req, res) => {
      res.status(503).json({
        message: 'Authentication is unavailable without PostgreSQL.',
      });
    });
  }

  // Existing e-commerce API routes.
  app.use('/api', createApiRouter(controllers));

  // Error handling must remain after all routes.
  app.use(notFound);
  app.use(errorHandler);

  return app;
}

module.exports = createApp;
