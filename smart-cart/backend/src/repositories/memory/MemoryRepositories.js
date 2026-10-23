// NON-PERSISTENT fallback. Same interfaces as repositories/postgres, data lives in process memory
// and resets whenever the server restarts. Used only when DB_MODE=memory (or ALLOW_MEMORY_FALLBACK=true).
const AppError = require('../../utils/AppError');
const Product = require('../../models/Product');
const Coupon = require('../../models/Coupon');
const Order = require('../../models/Order');
const seed = require('./seedData');

function createMemoryStore() {
  return {
    products: structuredClone(seed.products),
    coupons: structuredClone(seed.coupons),
    cart: [],            // [{ product_id, quantity }]
    orders: [],
    orderItems: [],
    seq: { order: 0, item: 0 },
  };
}

class MemoryProductRepository {
  constructor(store) { this.store = store; }
  async list({ category } = {}) {
    return this.store.products
      .filter((r) => r.is_active && (!category || r.category.toLowerCase() === category.toLowerCase()))
      .map(Product.fromRow);
  }
  async findById(id) {
    const row = this.store.products.find((r) => r.id === id);
    return row ? Product.fromRow(row) : null;
  }
  async findByIds(ids) {
    return this.store.products.filter((r) => ids.includes(r.id)).map(Product.fromRow);
  }
}

class MemoryCouponRepository {
  constructor(store) { this.store = store; }
  async findByCode(code) {
    const row = this.store.coupons.find((r) => r.code === code);
    return row ? Coupon.fromRow(row) : null;
  }
  async listActive() {
    return this.store.coupons.filter((r) => r.is_active).map(Coupon.fromRow);
  }
}

class MemoryCartRepository {
  constructor(store) { this.store = store; }
  async getItems() {
    return this.store.cart.map((r) => ({ productId: r.product_id, quantity: r.quantity }));
  }
  async upsert(productId, quantity) {
    const existing = this.store.cart.find((r) => r.product_id === productId);
    if (existing) existing.quantity = quantity;
    else this.store.cart.push({ product_id: productId, quantity });
  }
  async remove(productId) {
    const before = this.store.cart.length;
    this.store.cart = this.store.cart.filter((r) => r.product_id !== productId);
    return this.store.cart.length < before;
  }
  async clear() { this.store.cart = []; }
}

class MemoryOrderTransaction {
  constructor(store) { this.store = store; }
  async getCartItems() {
    return this.store.cart.map((r) => ({ productId: r.product_id, quantity: r.quantity }));
  }
  async lockProducts(ids) {
    return this.store.products.filter((r) => ids.includes(r.id)).map(Product.fromRow);
  }
  async findCoupon(code) {
    const row = this.store.coupons.find((r) => r.code === code);
    return row ? Coupon.fromRow(row) : null;
  }
  async decrementStock(productId, quantity) {
    const row = this.store.products.find((r) => r.id === productId);
    if (!row || row.stock_quantity < quantity) {
      throw new AppError(409, 'INSUFFICIENT_STOCK', 'Stock changed while placing your order. Please review your cart.');
    }
    row.stock_quantity -= quantity;
  }
  async insertOrder(o) {
    if (this.store.orders.some((r) => r.idempotency_key === o.idempotencyKey)) {
      throw new AppError(409, 'DUPLICATE_ORDER', 'This order was already submitted.');
    }
    const id = ++this.store.seq.order;
    this.store.orders.push({
      id, order_number: o.orderNumber, idempotency_key: o.idempotencyKey, customer_name: o.customerName,
      customer_email: o.customerEmail, shipping_address: o.shippingAddress, subtotal: o.subtotal,
      discount_amount: o.discount, tax_amount: o.tax, total_amount: o.total, coupon_code: o.couponCode,
      status: o.status, created_at: new Date().toISOString(),
    });
    return id;
  }
  async insertOrderItems(orderId, items) {
    for (const i of items) {
      this.store.orderItems.push({
        id: ++this.store.seq.item, order_id: orderId, product_id: i.productId, product_name: i.name,
        unit_price: i.unitPrice, quantity: i.quantity, line_total: i.lineTotal,
      });
    }
  }
  async clearCart() { this.store.cart = []; }
}

class MemoryOrderRepository {
  constructor(store) { this.store = store; }

  // Mimics a DB transaction: snapshot first, restore the snapshot if anything throws.
  async withTransaction(work) {
    const snapshot = structuredClone(this.store);
    try {
      return await work(new MemoryOrderTransaction(this.store));
    } catch (err) {
      Object.assign(this.store, snapshot);
      throw err;
    }
  }

  #build(row) {
    if (!row) return null;
    return Order.fromRows(row, this.store.orderItems.filter((i) => i.order_id === row.id));
  }
  async findByOrderNumber(n) { return this.#build(this.store.orders.find((r) => r.order_number === n)); }
  async findByIdempotencyKey(k) { return this.#build(this.store.orders.find((r) => r.idempotency_key === k)); }
}

module.exports = {
  createMemoryStore, MemoryProductRepository, MemoryCouponRepository, MemoryCartRepository, MemoryOrderRepository,
};
