
const AppError = require('../../utils/AppError');
const Product = require('../../models/Product');
const Coupon = require('../../models/Coupon');
const Order = require('../../models/Order');

class PgOrderTransaction {
  constructor(client, userId) {
    this.client = client;
    this.userId = userId;
  }

  async getCartItems() {
    const { rows } = await this.client.query(
      `SELECT product_id, quantity
       FROM cart_items
       WHERE user_id = $1
       ORDER BY updated_at, product_id`,
      [this.userId]
    );

    return rows.map((row) => ({
      productId: row.product_id,
      quantity: row.quantity,
    }));
  }

  async lockProducts(ids) {
    const { rows } = await this.client.query(
      `SELECT * FROM products
       WHERE id = ANY($1::int[])
       ORDER BY id
       FOR UPDATE`,
      [ids]
    );

    return rows.map(Product.fromRow);
  }

  async findCoupon(code) {
    const { rows } = await this.client.query(
      'SELECT * FROM coupons WHERE code = $1',
      [code]
    );

    return rows[0] ? Coupon.fromRow(rows[0]) : null;
  }

  async decrementStock(productId, quantity) {
    const result = await this.client.query(
      `UPDATE products
       SET stock_quantity = stock_quantity - $2
       WHERE id = $1 AND stock_quantity >= $2`,
      [productId, quantity]
    );

    if (result.rowCount !== 1) {
      throw new AppError(
        409,
        'INSUFFICIENT_STOCK',
        'Stock changed while placing your order. Please review your cart.'
      );
    }
  }

  async insertOrder(order) {
    try {
      const { rows } = await this.client.query(
        `INSERT INTO orders (
          user_id, order_number, idempotency_key,
          customer_name, customer_email, shipping_address,
          subtotal, discount_amount, tax_amount, total_amount,
          coupon_code, status
        )
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
        RETURNING id`,
        [
          this.userId,
          order.orderNumber,
          order.idempotencyKey,
          order.customerName,
          order.customerEmail,
          order.shippingAddress,
          order.subtotal,
          order.discount,
          order.tax,
          order.total,
          order.couponCode,
          order.status,
        ]
      );

      return rows[0].id;
    } catch (err) {
      if (
        err.code === '23505' &&
        err.constraint === 'uq_orders_idempotency_key'
      ) {
        throw new AppError(
          409,
          'DUPLICATE_ORDER',
          'This order was already submitted.'
        );
      }

      throw err;
    }
  }

  async insertOrderItems(orderId, items) {
    for (const item of items) {
      await this.client.query(
        `INSERT INTO order_items (
          order_id, product_id, product_name,
          unit_price, quantity, line_total
        )
        VALUES ($1,$2,$3,$4,$5,$6)`,
        [
          orderId,
          item.productId,
          item.name,
          item.unitPrice,
          item.quantity,
          item.lineTotal,
        ]
      );
    }
  }

  async clearCart() {
    await this.client.query(
      'DELETE FROM cart_items WHERE user_id = $1',
      [this.userId]
    );
  }
}

class OrderRepository {
  constructor(pool) {
    this.pool = pool;
  }

  async withTransaction(userId, work) {
    const client = await this.pool.connect();

    try {
      await client.query('BEGIN');

      const result = await work(new PgOrderTransaction(client, userId));

      await client.query('COMMIT');
      return result;
    } catch (err) {
      await client.query('ROLLBACK').catch(() => {});
      throw err;
    } finally {
      client.release();
    }
  }

  async #load(where, value, userId) {
    const { rows } = await this.pool.query(
      `SELECT * FROM orders
       WHERE ${where} = $1 AND user_id = $2`,
      [value, userId]
    );

    if (!rows[0]) return null;

    const items = await this.pool.query(
      `SELECT * FROM order_items
       WHERE order_id = $1
       ORDER BY id`,
      [rows[0].id]
    );

    return Order.fromRows(rows[0], items.rows);
  }

  findByOrderNumber(orderNumber, userId) {
    return this.#load('order_number', orderNumber, userId);
  }

  findByIdempotencyKey(key, userId) {
    return this.#load('idempotency_key', key, userId);
  }
}

module.exports = OrderRepository;
