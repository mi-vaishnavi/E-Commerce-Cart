const ProductRepository = require('./postgres/ProductRepository');
const CouponRepository = require('./postgres/CouponRepository');
const CartRepository = require('./postgres/CartRepository');
const OrderRepository = require('./postgres/OrderRepository');
const memory = require('./memory/MemoryRepositories');

function createRepositories(mode, pool) {
  if (mode === 'memory') {
    const store = memory.createMemoryStore();
    return {
      products: new memory.MemoryProductRepository(store),
      coupons: new memory.MemoryCouponRepository(store),
      cart: new memory.MemoryCartRepository(store),
      orders: new memory.MemoryOrderRepository(store),
    };
  }
  return {
    products: new ProductRepository(pool),
    coupons: new CouponRepository(pool),
    cart: new CartRepository(pool),
    orders: new OrderRepository(pool),
  };
}

module.exports = { createRepositories };
