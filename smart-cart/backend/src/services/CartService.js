
const AppError = require('../utils/AppError');

class CartService {
  constructor({ cartRepo, productRepo, pricing }) {
    this.cartRepo = cartRepo;
    this.productRepo = productRepo;
    this.pricing = pricing;
  }

  async getLines(userId) {
    const items = await this.cartRepo.getItems(userId);
    if (!items.length) return [];

    const products = await this.productRepo.findByIds(
      items.map((item) => item.productId)
    );

    const byId = new Map(products.map((product) => [product.id, product]));
    const lines = [];

    for (const item of items) {
      const product = byId.get(item.productId);

      if (product && product.isActive) {
        lines.push({ product, quantity: item.quantity });
      } else {
        await this.cartRepo.remove(userId, item.productId);
      }
    }

    return lines;
  }

  async getCart(userId) {
    const { items, itemCount, subtotalPaise } =
      this.pricing.summarizeLines(await this.getLines(userId));

    const api = this.pricing.toApi({
      items,
      itemCount,
      subtotalPaise,
      coupon: null,
      discountPaise: 0,
      taxPaise: 0,
      totalPaise: subtotalPaise,
    });

    return {
      items: api.items,
      itemCount,
      subtotal: api.subtotal,
    };
  }

  async #requireProduct(productId) {
    const product = await this.productRepo.findById(productId);

    if (!product || !product.isActive) {
      throw new AppError(
        404,
        'PRODUCT_NOT_FOUND',
        'That product does not exist.'
      );
    }

    return product;
  }

  #assertStock(product, wanted, inCart = 0) {
    if (product.stockQuantity === 0) {
      throw new AppError(
        409,
        'OUT_OF_STOCK',
        `${product.name} is out of stock.`
      );
    }

    if (wanted > product.stockQuantity) {
      const extra = inCart
        ? ` (you already have ${inCart} in your cart)`
        : '';

      throw new AppError(
        409,
        'INSUFFICIENT_STOCK',
        `Only ${product.stockQuantity} of ${product.name} in stock${extra}.`
      );
    }
  }

  async addItem(userId, productId, quantity) {
    const product = await this.#requireProduct(productId);

    const current = (await this.cartRepo.getItems(userId))
      .find((item) => item.productId === productId);

    const inCart = current ? current.quantity : 0;

    this.#assertStock(product, inCart + quantity, inCart);

    await this.cartRepo.upsert(userId, productId, inCart + quantity);

    return this.getCart(userId);
  }

  async updateQuantity(userId, productId, quantity) {
    const product = await this.#requireProduct(productId);

    const current = (await this.cartRepo.getItems(userId))
      .find((item) => item.productId === productId);

    if (!current) {
      throw new AppError(
        404,
        'ITEM_NOT_IN_CART',
        'That product is not in your cart.'
      );
    }

    this.#assertStock(product, quantity);

    await this.cartRepo.upsert(userId, productId, quantity);

    return this.getCart(userId);
  }

  async removeItem(userId, productId) {
    const removed = await this.cartRepo.remove(userId, productId);

    if (!removed) {
      throw new AppError(
        404,
        'ITEM_NOT_IN_CART',
        'That product is not in your cart.'
      );
    }

    return this.getCart(userId);
  }
}

module.exports = CartService;
