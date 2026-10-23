const { toPaise, fromPaise } = require('../utils/money');

class Order {
  constructor(data) {
    Object.assign(this, data);
  }

  static fromRows(row, itemRows) {
    return new Order({
      orderNumber: row.order_number,
      status: row.status,
      customerName: row.customer_name,
      customerEmail: row.customer_email,
      shippingAddress: row.shipping_address,
      subtotalPaise: toPaise(row.subtotal),
      discountPaise: toPaise(row.discount_amount),
      taxPaise: toPaise(row.tax_amount),
      totalPaise: toPaise(row.total_amount),
      couponCode: row.coupon_code,
      createdAt: new Date(row.created_at),
      items: itemRows.map((i) => ({
        productId: i.product_id,
        name: i.product_name,
        unitPricePaise: toPaise(i.unit_price),
        quantity: i.quantity,
        lineTotalPaise: toPaise(i.line_total),
      })),
    });
  }

  toApi() {
    return {
      orderId: this.orderNumber,
      status: this.status,
      simulated: true,
      customer: { name: this.customerName, email: this.customerEmail, shippingAddress: this.shippingAddress },
      items: this.items.map((i) => ({
        productId: i.productId,
        name: i.name,
        unitPrice: fromPaise(i.unitPricePaise),
        quantity: i.quantity,
        lineTotal: fromPaise(i.lineTotalPaise),
      })),
      pricing: {
        subtotal: fromPaise(this.subtotalPaise),
        couponCode: this.couponCode,
        discount: fromPaise(this.discountPaise),
        tax: fromPaise(this.taxPaise),
        total: fromPaise(this.totalPaise),
        currency: 'INR',
      },
      createdAt: this.createdAt.toISOString(),
    };
  }
}
module.exports = Order;
