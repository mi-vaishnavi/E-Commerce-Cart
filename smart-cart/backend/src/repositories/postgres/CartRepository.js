
class CartRepository {
  constructor(pool) {
    this.pool = pool;
  }

  async getItems(userId) {
    const { rows } = await this.pool.query(
      `SELECT product_id, quantity
       FROM cart_items
       WHERE user_id = $1
       ORDER BY updated_at, product_id`,
      [userId]
    );

    return rows.map((row) => ({
      productId: row.product_id,
      quantity: row.quantity,
    }));
  }

  async upsert(userId, productId, quantity) {
    await this.pool.query(
      `INSERT INTO cart_items (user_id, product_id, quantity)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id, product_id)
       DO UPDATE SET
         quantity = EXCLUDED.quantity,
         updated_at = NOW()`,
      [userId, productId, quantity]
    );
  }

  async remove(userId, productId) {
    const result = await this.pool.query(
      `DELETE FROM cart_items
       WHERE user_id = $1 AND product_id = $2`,
      [userId, productId]
    );

    return result.rowCount > 0;
  }

  async clear(userId) {
    await this.pool.query(
      'DELETE FROM cart_items WHERE user_id = $1',
      [userId]
    );
  }
}

module.exports = CartRepository;
