import { useRef, useState } from 'react';
import { api } from '../api/client';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { formatMoney, newIdempotencyKey } from '../utils/format';
import CouponPanel from '../components/CouponPanel';
import PriceSummary from '../components/PriceSummary';
import { EmptyState } from '../components/States';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function validate(f) {
  const e = {};
  if (f.customerName.trim().length < 2) e.customerName = 'Enter your full name.';
  if (!EMAIL.test(f.customerEmail.trim())) e.customerEmail = 'Enter a valid email address, like name@example.com.';
  if (f.shippingAddress.trim().length < 10) e.shippingAddress = 'Enter your full shipping address (at least 10 characters).';
  return e;
}

function Field({ id, label, error, children }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm font-medium">{label}</label>
      {children}
      {error && <p id={`${id}-error`} role="alert" className="mt-1.5 text-sm text-danger">{error}</p>}
    </div>
  );
}

export default function CheckoutPage({ onBack, onPlaced }) {
  const { cart, appliedCode, preview, pricingLoading, resetAfterOrder } = useCart();
  const toast = useToast();
  const [form, setForm] = useState({ customerName: '', customerEmail: '', shippingAddress: '' });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  // One key per checkout attempt: retrying the same attempt can never create a second order.
  const keyRef = useRef(newIdempotencyKey());

  const set = (name) => (e) => {
    setForm((f) => ({ ...f, [name]: e.target.value }));
    setErrors((er) => ({ ...er, [name]: undefined }));
  };

  async function submit(e) {
    e.preventDefault();
    if (submitting) return;
    const found = validate(form);
    setErrors(found);
    if (Object.keys(found).length) {
      document.getElementById(`${Object.keys(found)[0]}`)?.focus();
      return;
    }
    setSubmitting(true);
    try {
      const { order } = await api.placeOrder({ ...form, couponCode: appliedCode, idempotencyKey: keyRef.current });
      resetAfterOrder();
      keyRef.current = newIdempotencyKey();
      onPlaced(order.orderId);
    } catch (err) {
      if (err.details) setErrors(err.details);
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (cart.items.length === 0) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-10">
        <EmptyState title="Nothing to check out" text="Your cart is empty."
          action={<button type="button" className="btn-primary mt-4" onClick={onBack}>Browse products</button>} />
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <button type="button" className="mb-4 text-sm font-medium underline underline-offset-2" onClick={onBack}>Back to shop</button>
      <h1 className="text-3xl font-bold tracking-tight">Checkout</h1>
      <p className="mt-1 rounded-lg border border-sun bg-sunsoft px-3 py-2 text-sm">
        This is a simulated order. No payment is taken and nothing is shipped.
      </p>

      <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_22rem]">
        <form onSubmit={submit} noValidate className="card space-y-5 p-6" aria-label="Customer details">
          <h2 className="text-xl font-semibold">Where should we send it?</h2>
          <Field id="customerName" label="Full name" error={errors.customerName}>
            <input id="customerName" className="field" autoComplete="name" value={form.customerName} onChange={set('customerName')}
              aria-invalid={Boolean(errors.customerName)} aria-describedby={errors.customerName ? 'customerName-error' : undefined} />
          </Field>
          <Field id="customerEmail" label="Email" error={errors.customerEmail}>
            <input id="customerEmail" type="email" className="field" autoComplete="email" value={form.customerEmail} onChange={set('customerEmail')}
              aria-invalid={Boolean(errors.customerEmail)} aria-describedby={errors.customerEmail ? 'customerEmail-error' : undefined} />
          </Field>
          <Field id="shippingAddress" label="Shipping address" error={errors.shippingAddress}>
            <textarea id="shippingAddress" rows={4} className="field" autoComplete="street-address" value={form.shippingAddress} onChange={set('shippingAddress')}
              aria-invalid={Boolean(errors.shippingAddress)} aria-describedby={errors.shippingAddress ? 'shippingAddress-error' : undefined} />
          </Field>
          <button type="submit" className="btn-primary w-full" disabled={submitting || pricingLoading || !preview}>
            {submitting ? 'Placing order…' : `Place simulated order${preview ? ` · ${formatMoney(preview.total)}` : ''}`}
          </button>
        </form>

        <aside className="card h-fit space-y-5 p-6" aria-label="Order summary">
          <h2 className="text-xl font-semibold">Order summary</h2>
          <ul className="space-y-2 text-sm">
            {cart.items.map((i) => (
              <li key={i.productId} className="flex justify-between gap-3">
                <span>{i.name} <span className="text-muted">× {i.quantity}</span></span>
                <span className="tabular-nums">{formatMoney(i.lineTotal)}</span>
              </li>
            ))}
          </ul>
          <CouponPanel />
          <PriceSummary preview={preview} loading={pricingLoading} />
        </aside>
      </div>
    </main>
  );
}
