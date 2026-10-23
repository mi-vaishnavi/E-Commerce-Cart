const BASE = import.meta.env.VITE_API_BASE_URL || '/api';

export class ApiError extends Error {
  constructor(message, code, status, details) {
    super(message);
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

async function request(path, { method = 'GET', body } = {}) {
  let res;
  try {
    res = await fetch(`${BASE}${path}`, {
      method,
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError('Cannot reach the server. Check that the backend is running.', 'NETWORK_ERROR', 0);
  }
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new ApiError(data?.error?.message || 'Something went wrong. Please try again.', data?.error?.code, res.status, data?.error?.details);
  }
  return data;
}

export const api = {
  getProducts: (category) => request(`/products${category ? `?category=${encodeURIComponent(category)}` : ''}`),
  getProduct: (id) => request(`/products/${id}`),
  getCart: () => request('/cart'),
  addItem: (body) => request('/cart/items', { method: 'POST', body }),
  updateItem: (productId, quantity) => request(`/cart/items/${productId}`, { method: 'PATCH', body: { quantity } }),
  removeItem: (productId) => request(`/cart/items/${productId}`, { method: 'DELETE' }),
  validateCoupon: (body) => request('/coupons/validate', { method: 'POST', body }),
  recommendCoupon: (body) => request('/coupons/recommend', { method: 'POST', body }),
  previewCheckout: (body) => request('/checkout/preview', { method: 'POST', body }),
  placeOrder: (body) => request('/orders', { method: 'POST', body }),
  getOrder: (orderId) => request(`/orders/${encodeURIComponent(orderId)}`),
};
