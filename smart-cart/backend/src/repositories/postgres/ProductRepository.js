const Product = require('../../models/Product');

class ProductRepository {
  constructor(pool) {
    this.pool = pool;
  }

  async list({ category } = {}) {
    const params = [];
    let where = 'WHERE is_active';
    if (category) {
      params.push(category);
      where += ' AND LOWER(category) = LOWER($1)';
    }
    const { rows } = await this.pool.query(`SELECT * FROM products ${where} ORDER BY id`, params);
    return rows.map(Product.fromRow);
  }

  async findById(id) {
    const { rows } = await this.pool.query('SELECT * FROM products WHERE id = $1', [id]);
    return rows[0] ? Product.fromRow(rows[0]) : null;
  }

  async findByIds(ids) {
    if (!ids.length) return [];
    const { rows } = await this.pool.query('SELECT * FROM products WHERE id = ANY($1::int[]) ORDER BY id', [ids]);
    return rows.map(Product.fromRow);
  }
}
module.exports = ProductRepository;
