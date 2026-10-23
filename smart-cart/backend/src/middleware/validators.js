// Request validation. Each validator parses req and stores clean values on req.valid, or rejects with 400.
const AppError = require('../utils/AppError');

const fail = (message, details) => new AppError(400, 'VALIDATION_ERROR', message, details);

function toInt(value, { min = 1, max = 1_000_000 } = {}) {
  const n = typeof value === 'string' && /^-?\d+$/.test(value.trim()) ? Number(value) : value;
  return Number.isInteger(n) && n >= min && n <= max ? n : null;
}

const optionalCode = (value, field) => {
  if (value === undefined || value === null || value === '') return null;
  if (typeof value !== 'string' || value.trim().length > 40) throw fail(`${field} must be a short text value.`, { [field]: 'Enter a valid coupon code.' });
  return value.trim().toUpperCase();
};

const productIdParam = (req, _res, next) => {
  const id = toInt(req.params.id ?? req.params.productId);
  if (id === null) return next(fail('Product id must be a positive whole number.'));
  req.valid = { productId: id };
  next();
};

const addItem = (req, _res, next) => {
  const body = req.body || {};
  const productId = toInt(body.productId);
  const quantity = body.quantity === undefined ? 1 : toInt(body.quantity, { max: 99 });
  if (productId === null) return next(fail('productId must be a positive whole number.'));
  if (quantity === null) return next(fail('quantity must be a whole number between 1 and 99.'));
  req.valid = { productId, quantity };
  next();
};

const updateQuantity = (req, _res, next) => {
  const productId = toInt(req.params.productId);
  const quantity = toInt((req.body || {}).quantity, { max: 99 });
  if (productId === null) return next(fail('Product id must be a positive whole number.'));
  if (quantity === null) return next(fail('quantity must be a whole number between 1 and 99. Use DELETE to remove an item.'));
  req.valid = { productId, quantity };
  next();
};

const validateCoupon = (req, _res, next) => {
  try {
    const code = optionalCode((req.body || {}).code, 'code');
    if (!code) throw fail('Enter a coupon code.', { code: 'Enter a coupon code.' });
    req.valid = { code, appliedCode: optionalCode((req.body || {}).appliedCode, 'appliedCode') };
    next();
  } catch (err) { next(err); }
};

const recommendCoupon = (req, _res, next) => {
  try {
    req.valid = { appliedCode: optionalCode((req.body || {}).appliedCode, 'appliedCode') };
    next();
  } catch (err) { next(err); }
};

const previewCheckout = (req, _res, next) => {
  try {
    req.valid = { couponCode: optionalCode((req.body || {}).couponCode, 'couponCode') };
    next();
  } catch (err) { next(err); }
};

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const placeOrder = (req, _res, next) => {
  try {
    const b = req.body || {};
    const errors = {};
    const str = (v) => (typeof v === 'string' ? v.trim() : '');

    const customerName = str(b.customerName);
    const customerEmail = str(b.customerEmail).toLowerCase();
    const shippingAddress = str(b.shippingAddress);
    const idempotencyKey = str(b.idempotencyKey);

    if (customerName.length < 2 || customerName.length > 100) errors.customerName = 'Enter your full name (2-100 characters).';
    if (!EMAIL.test(customerEmail) || customerEmail.length > 160) errors.customerEmail = 'Enter a valid email address.';
    if (shippingAddress.length < 10 || shippingAddress.length > 500) errors.shippingAddress = 'Enter a complete shipping address (10-500 characters).';
    if (!/^[A-Za-z0-9_-]{8,64}$/.test(idempotencyKey)) errors.idempotencyKey = 'A client-generated idempotency key (8-64 letters, digits, - or _) is required.';

    const couponCode = optionalCode(b.couponCode, 'couponCode');
    if (Object.keys(errors).length) throw fail('Please fix the highlighted fields.', errors);

    req.valid = { customerName, customerEmail, shippingAddress, idempotencyKey, couponCode };
    next();
  } catch (err) { next(err); }
};

const orderNumberParam = (req, _res, next) => {
  const id = String(req.params.orderId || '').toUpperCase();
  if (!/^ORD-\d{8}-[A-F0-9]{8}$/.test(id)) return next(fail('Order id must look like ORD-20250101-1A2B3C4D.'));
  req.valid = { orderNumber: id };
  next();
};

module.exports = {
  productIdParam, addItem, updateQuantity, validateCoupon, recommendCoupon, previewCheckout, placeOrder, orderNumberParam,
};
