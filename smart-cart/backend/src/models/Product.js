const { toPaise, fromPaise } = require('../utils/money');

class Product {
  constructor({ id, name, description, category, pricePaise, stockQuantity, imageUrl, isActive }) {
    Object.assign(this, { id, name, description, category, pricePaise, stockQuantity, imageUrl, isActive });
  }

  static fromRow(row) {
    return new Product({
      id: row.id,
      name: row.name,
      description: row.description,
      category: row.category,
      pricePaise: toPaise(row.price),
      stockQuantity: row.stock_quantity,
      imageUrl: row.image_url,
      isActive: row.is_active,
    });
  }

  toApi() {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      category: this.category,
      price: fromPaise(this.pricePaise),
      stockQuantity: this.stockQuantity,
      inStock: this.stockQuantity > 0,
      imageUrl: this.imageUrl,
    };
  }
}
module.exports = Product;
